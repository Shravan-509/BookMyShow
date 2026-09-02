const fs = require("fs");
const path = require("path");

const CITY_CODE_PATTERN = /^[A-Z]{2,5}$/;
const VALID_TIERS = new Set(["TIER_1", "TIER_2", "TIER_3"]);

const normalizeTier = (tier) => {
    const normalizedTier = String(tier || "").trim().toUpperCase().replace(/\s+/g, "_");
    if (normalizedTier === "TIER_1" || normalizedTier === "TIER1") {
        return "TIER_1";
    }
    if (normalizedTier === "TIER_2" || normalizedTier === "TIER2") {
        return "TIER_2";
    }
    if (normalizedTier === "TIER_3" || normalizedTier === "TIER3") {
        return "TIER_3";
    }
    return normalizedTier;
};

const parseCsvLine = (line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === "\"" && nextChar === "\"") {
            current += "\"";
            index += 1;
        } else if (char === "\"") {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
};

const parseCsv = (content) => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (!lines.length) {
        return [];
    }

    const headers = parseCsvLine(lines[0]).map((header) => header.trim());
    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        return headers.reduce((record, header, index) => ({
            ...record,
            [header]: values[index],
        }), {});
    });
};

const loadCityRecords = (filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const extension = path.extname(filePath).toLowerCase();

    if (extension === ".json") {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : parsed.cities || [];
    }

    if (extension === ".csv") {
        return parseCsv(content);
    }

    throw new Error("City import file must be JSON or CSV");
};

const validateAndNormalizeRecord = (record, index) => {
    const cityCode = String(record.city_id || "").trim().toUpperCase();
    const cityName = String(record.city_name || "").trim();
    const state = String(record.state || "").trim();
    const tier = normalizeTier(record.tier);
    const latitude = Number(record.latitude);
    const longitude = Number(record.longitude);
    const errors = [];

    if (!cityCode) {
        errors.push("missing city_id");
    } else if (!CITY_CODE_PATTERN.test(cityCode)) {
        errors.push("invalid city_id format");
    }

    if (!cityName) {
        errors.push("missing city_name");
    }

    if (!state) {
        errors.push("missing state");
    }

    if (!VALID_TIERS.has(tier)) {
        errors.push("invalid tier");
    }

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        errors.push("invalid latitude");
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        errors.push("invalid longitude");
    }

    return {
        errors,
        invalidRecord: {
            index,
            cityCode,
            cityName,
            state,
            errors,
        },
        city: {
            cityCode,
            cityName,
            state,
            country: "India",
            tier,
            location: {
                type: "Point",
                coordinates: [longitude, latitude],
            },
            isActive: true,
        },
    };
};

const cityIdentityKey = ({ cityName, state, country }) => (
    [cityName.toLowerCase(), state.toLowerCase(), country.toLowerCase()].join("|")
);

const findExistingCity = async (City, city) => {
    const existingByCode = await City.findOne({ cityCode: city.cityCode });
    const existingByIdentity = await City.findOne({
        cityName: city.cityName,
        state: city.state,
        country: city.country,
    });

    if (existingByCode && existingByIdentity
        && String(existingByCode._id) !== String(existingByIdentity._id)) {
        return { conflict: true, existingByCode, existingByIdentity };
    }

    return { city: existingByCode || existingByIdentity };
};

const buildSafeUpdate = (existingCity, city) => {
    const update = {};

    if (!existingCity.cityCode && city.cityCode) {
        update.cityCode = city.cityCode;
    }

    if (!existingCity.tier && city.tier) {
        update.tier = city.tier;
    }

    if (!existingCity.location?.coordinates?.length) {
        update.location = city.location;
    }

    return update;
};

const runCityImport = async ({ records, City, applyChanges = false, logger = console }) => {
    const summary = {
        totalRecords: records.length,
        inserted: 0,
        updated: 0,
        reused: 0,
        skipped: 0,
        invalid: 0,
        invalidRecords: [],
    };
    const seenCityCodes = new Set();
    const seenIdentities = new Set();

    for (let index = 0; index < records.length; index += 1) {
        const { city, errors, invalidRecord } = validateAndNormalizeRecord(records[index], index + 1);
        const identityKey = cityIdentityKey(city);

        if (seenCityCodes.has(city.cityCode)) {
            errors.push("duplicate city_id in import file");
        }

        if (seenIdentities.has(identityKey)) {
            errors.push("duplicate city/state/country in import file");
        }

        if (errors.length) {
            summary.invalid += 1;
            summary.invalidRecords.push({ ...invalidRecord, errors });
            continue;
        }

        seenCityCodes.add(city.cityCode);
        seenIdentities.add(identityKey);

        const existing = await findExistingCity(City, city);
        if (existing.conflict) {
            summary.skipped += 1;
            summary.invalidRecords.push({
                index: index + 1,
                cityCode: city.cityCode,
                cityName: city.cityName,
                state: city.state,
                errors: ["cityCode and city/state/country match different existing cities"],
            });
            continue;
        }

        if (existing.city) {
            const update = buildSafeUpdate(existing.city, city);
            if (!Object.keys(update).length) {
                summary.reused += 1;
                continue;
            }

            if (applyChanges) {
                await City.updateOne({ _id: existing.city._id }, { $set: update }, { runValidators: true });
            }
            summary.updated += 1;
            continue;
        }

        if (applyChanges) {
            await City.create(city);
        }
        summary.inserted += 1;
    }

    logger.log(`Mode: ${applyChanges ? "apply" : "dry-run"}`);
    logger.log(`Records scanned: ${summary.totalRecords}`);
    logger.log(`Inserted: ${summary.inserted}`);
    logger.log(`Updated: ${summary.updated}`);
    logger.log(`Reused: ${summary.reused}`);
    logger.log(`Skipped: ${summary.skipped}`);
    logger.log(`Invalid: ${summary.invalid}`);

    if (summary.invalidRecords.length) {
        logger.log("Invalid records:");
        summary.invalidRecords.forEach((record) => {
            logger.log(`- #${record.index} ${record.cityCode || "(missing code)"} ${record.cityName || "(missing city)"}: ${record.errors.join("; ")}`);
        });
    }

    return summary;
};

const parseArgs = (argv) => {
    const args = new Set(argv);
    const fileIndex = argv.findIndex((arg) => arg === "--file");
    const file = fileIndex >= 0 ? argv[fileIndex + 1] : null;

    return {
        applyChanges: args.has("--apply"),
        file,
    };
};

const importCities = async () => {
    require("dotenv").config();

    const { file, applyChanges } = parseArgs(process.argv.slice(2));
    if (!file) {
        throw new Error("Usage: node scripts/importCities.js --file <cities.json|cities.csv> [--apply]");
    }

    const mongoose = require("mongoose");
    const connectDB = require("../config/db");
    const City = require("../models/citySchema");
    const records = loadCityRecords(file);

    await connectDB();
    await runCityImport({ records, City, applyChanges });
    await mongoose.connection.close();
};

if (require.main === module) {
    importCities().catch(async (error) => {
        const mongoose = require("mongoose");
        console.error("City import failed:", error.message);
        await mongoose.connection.close();
        process.exit(1);
    });
}

module.exports = {
    CITY_CODE_PATTERN,
    VALID_TIERS,
    normalizeTier,
    parseCsv,
    loadCityRecords,
    validateAndNormalizeRecord,
    runCityImport,
};
