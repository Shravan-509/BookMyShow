const args = new Set(process.argv.slice(2));

const getTheatreId = (theatre) => theatre?._id || theatre;

const getTheatreName = (theatre) => theatre?.name || getTheatreId(theatre)?.toString?.() || "Unknown Theatre";

const getScreenId = (screen) => screen?._id || screen;

const printMapping = ({ logger, show, theatreName, currentScreen, activeScreensCount, targetScreen, action }) => {
    logger.log(`Show: ${show.name || show._id}`);
    logger.log(`Theatre: ${theatreName}`);
    logger.log(`Current Screen: ${currentScreen || "Legacy / Unassigned"}`);
    logger.log(`Active Screens Found: ${activeScreensCount}`);
    if (targetScreen) {
        logger.log(`Target Screen: ${targetScreen.name || targetScreen._id}`);
    }
    logger.log(`Action: ${action}`);
};

const runShowScreenBackfill = async ({ Show, Screen, applyChanges = false, logger = console }) => {
    const summary = {
        showsScanned: 0,
        alreadyAssigned: 0,
        updated: 0,
        noScreenSkipped: 0,
        ambiguousSkipped: 0,
        errors: 0,
    };
    const shows = await Show.find({}).populate("theatre").populate("screen");

    for (const show of shows) {
        summary.showsScanned += 1;

        try {
            if (show.screen) {
                summary.alreadyAssigned += 1;
                printMapping({
                    logger,
                    show,
                    theatreName: getTheatreName(show.theatre),
                    currentScreen: show.screen.name || getScreenId(show.screen)?.toString(),
                    activeScreensCount: "not checked",
                    action: "SKIPPED - ALREADY ASSIGNED",
                });
                continue;
            }

            const theatreId = getTheatreId(show.theatre);
            const activeScreens = await Screen.find({ theatre: theatreId, isActive: true }).sort({ screenNumber: 1 });

            if (activeScreens.length === 0) {
                summary.noScreenSkipped += 1;
                printMapping({
                    logger,
                    show,
                    theatreName: getTheatreName(show.theatre),
                    activeScreensCount: 0,
                    action: "SKIPPED - NO SCREEN",
                });
                continue;
            }

            if (activeScreens.length > 1) {
                summary.ambiguousSkipped += 1;
                printMapping({
                    logger,
                    show,
                    theatreName: getTheatreName(show.theatre),
                    activeScreensCount: activeScreens.length,
                    action: "SKIPPED - AMBIGUOUS",
                });
                continue;
            }

            const [targetScreen] = activeScreens;
            if (getScreenId(targetScreen.theatre).toString() !== theatreId.toString()) {
                summary.errors += 1;
                printMapping({
                    logger,
                    show,
                    theatreName: getTheatreName(show.theatre),
                    activeScreensCount: activeScreens.length,
                    targetScreen,
                    action: "SKIPPED - SCREEN THEATRE MISMATCH",
                });
                continue;
            }

            printMapping({
                logger,
                show,
                theatreName: getTheatreName(show.theatre),
                activeScreensCount: activeScreens.length,
                targetScreen,
                action: applyChanges ? "UPDATE" : "WOULD UPDATE",
            });

            if (!applyChanges) {
                summary.updated += 1;
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
                { $set: { screen: getScreenId(targetScreen) } }
            );

            if (updateResult.modifiedCount > 0) {
                summary.updated += 1;
            } else {
                summary.alreadyAssigned += 1;
            }
        } catch (error) {
            summary.errors += 1;
            logger.error(`Failed to process show ${show._id}:`, error.message);
        }
    }

    logger.log(`Mode: ${applyChanges ? "apply" : "dry-run"}`);
    logger.log(`Shows scanned: ${summary.showsScanned}`);
    logger.log(`Already assigned: ${summary.alreadyAssigned}`);
    logger.log(`${applyChanges ? "Updated" : "Would update"}: ${summary.updated}`);
    logger.log(`No Screen / skipped: ${summary.noScreenSkipped}`);
    logger.log(`Ambiguous / skipped: ${summary.ambiguousSkipped}`);
    logger.log(`Errors: ${summary.errors}`);

    return summary;
};

const backfillShowScreens = async () => {
    require("dotenv").config();

    const mongoose = require("mongoose");
    const connectDB = require("../config/db");
    require("../models/theatreSchema");
    const Show = require("../models/showSchema");
    const Screen = require("../models/screenSchema");

    await connectDB();
    await runShowScreenBackfill({ Show, Screen, applyChanges: args.has("--apply") });
    await mongoose.connection.close();
};

if (require.main === module) {
    backfillShowScreens().catch(async (error) => {
        const mongoose = require("mongoose");
        console.error("Show Screen backfill failed:", error.message);
        await mongoose.connection.close();
        process.exit(1);
    });
}

module.exports = {
    getTheatreId,
    getTheatreName,
    getScreenId,
    runShowScreenBackfill,
};
