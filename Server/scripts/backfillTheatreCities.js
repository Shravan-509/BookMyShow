const args = new Set(process.argv.slice(2));

const CITY_ALIASES = [
    { alias: "Visakhapatnam", cityCode: "VTZ" },
    { alias: "Vizag", cityCode: "VTZ" },
];

const findAddressAlias = (address = "") => {
    const normalizedAddress = String(address).trim();

    return CITY_ALIASES.find(({ alias }) => {
        const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const aliasPattern = new RegExp(`(^|[^a-z])${escapedAlias}([^a-z]|$)`, "i");
        return aliasPattern.test(normalizedAddress);
    });
};

const extractCityParts = (theatre) => {
    if (theatre.city) {
        return { status: "alreadyMigrated" };
    }

    const explicitCityName = typeof theatre.cityName === "string" ? theatre.cityName.trim() : "";
    const explicitState = typeof theatre.state === "string" ? theatre.state.trim() : "";
    const explicitCountry = typeof theatre.country === "string" ? theatre.country.trim() : "";

    if (explicitCityName && explicitState && explicitCountry) {
        return {
            status: "mappable",
            cityName: explicitCityName,
            state: explicitState,
            country: explicitCountry,
        };
    }

    const matchedAlias = findAddressAlias(theatre.address);
    if (matchedAlias) {
        return {
            status: "aliasMatched",
            alias: matchedAlias.alias,
            cityCode: matchedAlias.cityCode,
        };
    }

    return { status: "ambiguous" };
};

const cityKey = ({ cityName, state, country }) => (
    [cityName, state, country].join("|")
);

const runBackfill = async ({ Theatre, City, applyChanges = false, logger = console }) => {
    const summary = {
        theatresScanned: 0,
        alreadyMigrated: 0,
        citiesDiscovered: 0,
        citiesCreated: 0,
        theatresUpdated: 0,
        ambiguousSkipped: 0,
        missingCitySkipped: 0,
        errors: 0,
    };

    const discoveredCities = new Set();
    const theatres = await Theatre.find({});

    for (const theatre of theatres) {
        summary.theatresScanned += 1;

        try {
            const cityParts = extractCityParts(theatre);

            if (cityParts.status === "alreadyMigrated") {
                summary.alreadyMigrated += 1;
                continue;
            }

            if (cityParts.status === "ambiguous") {
                summary.ambiguousSkipped += 1;
                continue;
            }

            if (cityParts.status === "aliasMatched") {
                const city = await City.findOne({ cityCode: cityParts.cityCode });

                if (!city) {
                    summary.missingCitySkipped += 1;
                    logger.log(`Theatre: ${theatre.name || theatre._id}`);
                    logger.log(`Address: ${theatre.address}`);
                    logger.log(`Matched alias: ${cityParts.alias}`);
                    logger.log(`Target City: ${cityParts.cityCode} not found`);
                    logger.log("Action: SKIP");
                    continue;
                }

                discoveredCities.add(cityParts.cityCode);
                logger.log(`Theatre: ${theatre.name || theatre._id}`);
                logger.log(`Address: ${theatre.address}`);
                logger.log(`Matched alias: ${cityParts.alias}`);
                logger.log(`Target City: ${city.cityName} (${city.cityCode})`);
                logger.log(`Action: ${applyChanges ? "UPDATE" : "WOULD UPDATE"}`);

                if (!applyChanges) {
                    continue;
                }

                const updateResult = await Theatre.updateOne(
                    { _id: theatre._id, city: { $exists: false } },
                    { $set: { city: city._id } }
                );

                if (updateResult.modifiedCount > 0) {
                    summary.theatresUpdated += 1;
                }
                continue;
            }

            const cityPayload = {
                cityName: cityParts.cityName,
                state: cityParts.state,
                country: cityParts.country,
            };

            discoveredCities.add(cityKey(cityPayload));

            if (!applyChanges) {
                continue;
            }

            const city = await City.findOneAndUpdate(
                cityPayload,
                { $setOnInsert: { ...cityPayload, isActive: true } },
                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                }
            );

            if (city.createdAt?.getTime() === city.updatedAt?.getTime()) {
                summary.citiesCreated += 1;
            }

            await Theatre.updateOne(
                { _id: theatre._id, city: { $exists: false } },
                { $set: { city: city._id } }
            );

            summary.theatresUpdated += 1;
        } catch (error) {
            summary.errors += 1;
            logger.error(`Failed to process theatre ${theatre._id}:`, error.message);
        }
    }

    summary.citiesDiscovered = discoveredCities.size;

    logger.log(`Mode: ${applyChanges ? "apply" : "dry-run"}`);
    logger.log(`Theatres scanned: ${summary.theatresScanned}`);
    logger.log(`Already migrated: ${summary.alreadyMigrated}`);
    logger.log(`Cities discovered: ${summary.citiesDiscovered}`);
    logger.log(`Cities created: ${summary.citiesCreated}`);
    logger.log(`Theatres updated: ${summary.theatresUpdated}`);
    logger.log(`Ambiguous/skipped: ${summary.ambiguousSkipped}`);
    logger.log(`Missing target city/skipped: ${summary.missingCitySkipped}`);
    logger.log(`Errors: ${summary.errors}`);

    return summary;
};

const backfillTheatreCities = async () => {
    require("dotenv").config();

    const mongoose = require("mongoose");
    const connectDB = require("../config/db");
    const City = require("../models/citySchema");
    const Theatre = require("../models/theatreSchema");

    await connectDB();
    await runBackfill({ Theatre, City, applyChanges: args.has("--apply") });
    await mongoose.connection.close();
};

if (require.main === module) {
    backfillTheatreCities().catch(async (error) => {
        const mongoose = require("mongoose");
        console.error("Migration failed:", error.message);
        await mongoose.connection.close();
        process.exit(1);
    });
}

module.exports = {
    CITY_ALIASES,
    findAddressAlias,
    extractCityParts,
    runBackfill,
};
