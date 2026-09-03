const fs = require("fs");
const path = require("path");

const args = new Set(process.argv.slice(2));
const DEFAULT_CONFIG_PATH = path.join(__dirname, "show-scheduler", "show_scheduler_config.json");

const getDocumentId = (value) => {
    if (!value) {
        return null;
    }
    if (typeof value.toHexString === "function") {
        return value.toHexString();
    }
    if (value._id && value._id !== value) {
        return getDocumentId(value._id);
    }
    return value.toString();
};

const getTheatreName = (theatre) => theatre?.name || getDocumentId(theatre) || "Unknown Theatre";

const getScreenName = (screen) => {
    if (!screen) {
        return "Unknown Screen";
    }
    const number = screen.screenNumber ? ` / Screen ${screen.screenNumber}` : "";
    return `${screen.name || getDocumentId(screen)}${number}`;
};

const normalizeShowTime = (value) => {
    if (typeof value !== "string") {
        return null;
    }

    const text = value.trim().toUpperCase();
    const twentyFourHourMatch = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (twentyFourHourMatch) {
        return `${twentyFourHourMatch[1].padStart(2, "0")}:${twentyFourHourMatch[2]}`;
    }

    const twelveHourMatch = text.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/);
    if (!twelveHourMatch) {
        return null;
    }

    let hour = Number(twelveHourMatch[1]);
    const minute = twelveHourMatch[2];
    const meridiem = twelveHourMatch[3];

    if (meridiem === "AM" && hour === 12) {
        hour = 0;
    } else if (meridiem === "PM" && hour !== 12) {
        hour += 12;
    }

    return `${String(hour).padStart(2, "0")}:${minute}`;
};

const loadSchedulerScreenAssignments = (configPath = DEFAULT_CONFIG_PATH) => {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return config?.schedule?.screen_assignments || {};
};

const createSummary = () => ({
    showsScanned: 0,
    alreadyAssigned: 0,
    eligibleMultiplexUnassigned: 0,
    updated: 0,
    noSlotAssignment: 0,
    invalidScreen: 0,
    crossTheatreScreen: 0,
    inactiveScreen: 0,
    unsupportedTime: 0,
    theatreNotConfigured: 0,
    errors: 0,
    byTheatre: {},
    byScreen: {},
    skippedShows: [],
});

const ensureTheatreBreakdown = (summary, theatreName) => {
    summary.byTheatre[theatreName] ||= {
        eligible: 0,
        updated: 0,
        noSlotAssignment: 0,
        invalidScreen: 0,
        crossTheatreScreen: 0,
        inactiveScreen: 0,
        unsupportedTime: 0,
    };
    return summary.byTheatre[theatreName];
};

const incrementScreenBreakdown = (summary, screen) => {
    const screenName = getScreenName(screen);
    summary.byScreen[screenName] = (summary.byScreen[screenName] || 0) + 1;
};

const printShowAudit = ({ logger, show, theatreName, normalizedTime, screen, action }) => {
    logger.log(`SHOW: ${getDocumentId(show)}`);
    logger.log(`Theatre: ${theatreName}`);
    logger.log(`Date: ${show.date || "Unknown Date"}`);
    logger.log(`Time: ${show.time}${normalizedTime ? ` -> ${normalizedTime}` : ""}`);
    logger.log("Current Screen: Legacy / Unassigned");
    if (screen) {
        logger.log(`Mapped Screen: ${getScreenName(screen)}`);
        logger.log(`Screen ID: ${getDocumentId(screen)}`);
    }
    logger.log(`Action: ${action}`);
};

const recordSkip = ({ summary, theatreBreakdown, show, reason }) => {
    summary.skippedShows.push({
        showId: getDocumentId(show),
        theatre: getTheatreName(show.theatre),
        time: show.time,
        reason,
    });
    if (theatreBreakdown && Object.prototype.hasOwnProperty.call(theatreBreakdown, reason)) {
        theatreBreakdown[reason] += 1;
    }
};

const runMultiplexShowScreenBackfill = async ({
    Show,
    Screen,
    screenAssignments,
    applyChanges = false,
    logger = console,
}) => {
    const summary = createSummary();
    const shows = await Show.find({}).populate("theatre").populate("screen");

    for (const show of shows) {
        summary.showsScanned += 1;

        try {
            if (show.screen) {
                summary.alreadyAssigned += 1;
                continue;
            }

            const theatreId = getDocumentId(show.theatre);
            const theatreName = getTheatreName(show.theatre);
            const theatreAssignments = theatreId ? screenAssignments[theatreId] : null;

            if (!theatreAssignments) {
                summary.theatreNotConfigured += 1;
                continue;
            }

            summary.eligibleMultiplexUnassigned += 1;
            const theatreBreakdown = ensureTheatreBreakdown(summary, theatreName);
            theatreBreakdown.eligible += 1;

            const normalizedTime = normalizeShowTime(show.time);
            if (!normalizedTime) {
                summary.unsupportedTime += 1;
                recordSkip({ summary, theatreBreakdown, show, reason: "unsupportedTime" });
                printShowAudit({
                    logger,
                    show,
                    theatreName,
                    normalizedTime,
                    action: "SKIPPED - UNSUPPORTED TIME FORMAT",
                });
                continue;
            }

            const configuredScreenId = theatreAssignments[normalizedTime];
            if (!configuredScreenId) {
                summary.noSlotAssignment += 1;
                recordSkip({ summary, theatreBreakdown, show, reason: "noSlotAssignment" });
                printShowAudit({
                    logger,
                    show,
                    theatreName,
                    normalizedTime,
                    action: "SKIPPED - NO SLOT ASSIGNMENT",
                });
                continue;
            }

            const configuredScreen = await Screen.findById(configuredScreenId);
            if (!configuredScreen) {
                summary.invalidScreen += 1;
                recordSkip({ summary, theatreBreakdown, show, reason: "invalidScreen" });
                printShowAudit({
                    logger,
                    show,
                    theatreName,
                    normalizedTime,
                    action: "SKIPPED - INVALID SCREEN",
                });
                continue;
            }

            if (getDocumentId(configuredScreen.theatre) !== theatreId) {
                summary.crossTheatreScreen += 1;
                recordSkip({ summary, theatreBreakdown, show, reason: "crossTheatreScreen" });
                printShowAudit({
                    logger,
                    show,
                    theatreName,
                    normalizedTime,
                    screen: configuredScreen,
                    action: "SKIPPED - CROSS THEATRE SCREEN",
                });
                continue;
            }

            if (!configuredScreen.isActive) {
                summary.inactiveScreen += 1;
                recordSkip({ summary, theatreBreakdown, show, reason: "inactiveScreen" });
                printShowAudit({
                    logger,
                    show,
                    theatreName,
                    normalizedTime,
                    screen: configuredScreen,
                    action: "SKIPPED - INACTIVE SCREEN",
                });
                continue;
            }

            printShowAudit({
                logger,
                show,
                theatreName,
                normalizedTime,
                screen: configuredScreen,
                action: applyChanges ? "UPDATE" : "WOULD UPDATE",
            });

            if (!applyChanges) {
                summary.updated += 1;
                theatreBreakdown.updated += 1;
                incrementScreenBreakdown(summary, configuredScreen);
                continue;
            }

            const updateResult = await Show.updateOne(
                {
                    _id: show._id,
                    $or: [
                        { screen: { $exists: false } },
                        { screen: null },
                    ],
                },
                { $set: { screen: getDocumentId(configuredScreen) } },
                { timestamps: false }
            );

            if (updateResult.modifiedCount > 0) {
                summary.updated += 1;
                theatreBreakdown.updated += 1;
                incrementScreenBreakdown(summary, configuredScreen);
            } else {
                summary.alreadyAssigned += 1;
            }
        } catch (error) {
            summary.errors += 1;
            logger.error(`Failed to process show ${getDocumentId(show)}: ${error.message}`);
        }
    }

    logger.log(`Mode: ${applyChanges ? "apply" : "dry-run"}`);
    logger.log(`Shows scanned: ${summary.showsScanned}`);
    logger.log(`Already assigned: ${summary.alreadyAssigned}`);
    logger.log(`Eligible multiplex unassigned: ${summary.eligibleMultiplexUnassigned}`);
    logger.log(`${applyChanges ? "Updated" : "Would update"}: ${summary.updated}`);
    logger.log(`No slot assignment: ${summary.noSlotAssignment}`);
    logger.log(`Invalid screen: ${summary.invalidScreen}`);
    logger.log(`Cross-Theatre screen: ${summary.crossTheatreScreen}`);
    logger.log(`Inactive screen: ${summary.inactiveScreen}`);
    logger.log(`Unsupported time: ${summary.unsupportedTime}`);
    logger.log(`Theatre not configured: ${summary.theatreNotConfigured}`);
    logger.log(`Errors: ${summary.errors}`);

    logger.log("Breakdown by Theatre:");
    Object.entries(summary.byTheatre).forEach(([theatreName, counts]) => {
        logger.log(`${theatreName}: eligible=${counts.eligible}, ${applyChanges ? "updated" : "wouldUpdate"}=${counts.updated}, noSlot=${counts.noSlotAssignment}, invalidScreen=${counts.invalidScreen}, crossTheatre=${counts.crossTheatreScreen}, inactive=${counts.inactiveScreen}, unsupportedTime=${counts.unsupportedTime}`);
    });

    logger.log("Breakdown by Screen:");
    Object.entries(summary.byScreen).forEach(([screenName, count]) => {
        logger.log(`${screenName}: ${applyChanges ? "updated" : "wouldUpdate"}=${count}`);
    });

    if (applyChanges) {
        logger.log("APPLY COMPLETE");
    } else {
        logger.log("DRY RUN - NO SHOWS WERE MODIFIED");
    }

    return summary;
};

const backfillMultiplexShowScreens = async () => {
    require("dotenv").config();

    const mongoose = require("mongoose");
    const connectDB = require("../config/db");
    require("../models/theatreSchema");
    const Show = require("../models/showSchema");
    const Screen = require("../models/screenSchema");
    const screenAssignments = loadSchedulerScreenAssignments();

    await connectDB();
    await runMultiplexShowScreenBackfill({
        Show,
        Screen,
        screenAssignments,
        applyChanges: args.has("--apply"),
    });
    await mongoose.connection.close();
};

if (require.main === module) {
    backfillMultiplexShowScreens().catch(async (error) => {
        const mongoose = require("mongoose");
        console.error("Multiplex Show Screen backfill failed:", error.message);
        await mongoose.connection.close();
        process.exit(1);
    });
}

module.exports = {
    DEFAULT_CONFIG_PATH,
    getDocumentId,
    getTheatreName,
    getScreenName,
    loadSchedulerScreenAssignments,
    normalizeShowTime,
    runMultiplexShowScreenBackfill,
};
