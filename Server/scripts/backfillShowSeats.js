const fs = require("fs");
const path = require("path");

const { SHOW_SEAT_AUDIT_CLASSIFICATION } = require("../services/showSeatService");

const REPORT_DIR = path.join(__dirname, "reports");
const UNSUPPORTED_WRITE_FLAGS = new Set([
    "--write",
    "--force",
    "--repair",
    "--delete",
    "--sync",
]);

const CLASSIFICATIONS = Object.freeze(Object.values(SHOW_SEAT_AUDIT_CLASSIFICATION));

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

const getDisplayName = (value) => value?.name || value?.title || getDocumentId(value);

const formatDate = (value) => {
    if (!value) {
        return null;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString();
    }

    return value.toString();
};

const parseArgs = (argv = []) => {
    const unsupportedFlags = argv.filter((arg) => UNSUPPORTED_WRITE_FLAGS.has(arg));
    if (unsupportedFlags.length > 0) {
        throw new Error(`Unsupported write flag(s): ${unsupportedFlags.join(", ")}. Only --apply enables writes.`);
    }

    return {
        mode: argv.includes("--apply") ? "APPLY" : "DRY_RUN",
    };
};

const createEmptyClassificationCounts = () => CLASSIFICATIONS.reduce((counts, classification) => ({
    ...counts,
    [classification]: 0,
}), {});

const createSummary = () => ({
    totalShowsAudited: 0,
    classificationCounts: createEmptyClassificationCounts(),
    totalProposedShowSeatDocuments: 0,
    totalExpectedShowSeatDocuments: 0,
    totalExistingShowSeatDocuments: 0,
    totalLegacyBookedSeatLabels: 0,
    showsWithWarnings: 0,
    eligibleForFutureApply: 0,
    skipped: 0,
});

const sanitizeArray = (value) => (Array.isArray(value) ? value : []);

const serializeAuditResult = ({ show, auditResult }) => ({
    showId: auditResult.showId || getDocumentId(show),
    movieId: getDocumentId(show.movie),
    movieName: getDisplayName(show.movie),
    theatreId: getDocumentId(show.theatre),
    theatreName: getDisplayName(show.theatre),
    screenId: auditResult.screenId || getDocumentId(show.screen),
    screenName: getDisplayName(show.screen),
    screenNumber: show.screen?.screenNumber || null,
    showDate: formatDate(show.date),
    showTime: show.time || null,
    classification: auditResult.classification,
    screenCapacity: auditResult.screenCapacity,
    activeSeatCount: auditResult.activeSeatCount,
    legacyBookedSeatCount: auditResult.legacyBookedSeatCount,
    existingShowSeatCount: auditResult.existingShowSeatCount,
    expectedShowSeatCount: auditResult.expectedShowSeatCount,
    proposedWriteCount: auditResult.proposedWriteCount,
    mismatchLabels: sanitizeArray(auditResult.mismatchLabels),
    duplicateLabels: sanitizeArray(auditResult.duplicateLabels),
    inactiveBookedLabels: sanitizeArray(auditResult.inactiveBookedLabels),
    warnings: sanitizeArray(auditResult.warnings),
    errorMessage: auditResult.error?.message || null,
});

const summarizeShows = (shows) => {
    const summary = createSummary();

    shows.forEach((show) => {
        summary.totalShowsAudited += 1;
        const classification = show.classification || SHOW_SEAT_AUDIT_CLASSIFICATION.OTHER_ERROR;
        if (!CLASSIFICATIONS.includes(classification)) {
            return;
        }

        summary.classificationCounts[classification] = (summary.classificationCounts[classification] || 0) + 1;
        summary.totalProposedShowSeatDocuments += show.proposedWriteCount || 0;
        summary.totalExpectedShowSeatDocuments += show.expectedShowSeatCount || 0;
        summary.totalExistingShowSeatDocuments += show.existingShowSeatCount || 0;
        summary.totalLegacyBookedSeatLabels += show.legacyBookedSeatCount || 0;

        if (show.warnings?.length || show.errorMessage) {
            summary.showsWithWarnings += 1;
        }

        if (classification === SHOW_SEAT_AUDIT_CLASSIFICATION.READY) {
            summary.eligibleForFutureApply += 1;
        } else {
            summary.skipped += 1;
        }
    });

    const countedClassifications = Object.values(summary.classificationCounts).reduce(
        (total, count) => total + count,
        0
    );

    if (countedClassifications !== summary.totalShowsAudited) {
        throw new Error(
            `Classification count mismatch: counted ${countedClassifications}, audited ${summary.totalShowsAudited}`
        );
    }

    return summary;
};

const buildReport = ({ shows, generatedAt = new Date(), databaseName = null, mode = "DRY_RUN" }) => ({
    metadata: {
        generatedAt: generatedAt.toISOString(),
        mode,
        databaseName,
        script: "backfillShowSeats.js",
    },
    summary: summarizeShows(shows),
    shows,
});

const createReportPath = (generatedAt = new Date(), reportDir = REPORT_DIR) => {
    const timestamp = generatedAt.toISOString().replace(/[:.]/g, "-");
    return path.join(reportDir, `showseat-audit-${timestamp}.json`);
};

const writeJsonReport = (report, reportPath) => {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
};

const printShowReport = ({ logger, show }) => {
    logger.log(`Show: ${show.showId}`);
    logger.log(`Movie: ${show.movieName || show.movieId || "Unknown Movie"}`);
    logger.log(`Theatre: ${show.theatreName || show.theatreId || "Unknown Theatre"}`);
    logger.log(`Screen: ${show.screenName || show.screenId || "Legacy / Unassigned"}`);
    logger.log(`Date: ${show.showDate || "Unknown Date"}`);
    logger.log(`Time: ${show.showTime || "Unknown Time"}`);
    logger.log(`Classification: ${show.classification}`);
    logger.log(`Screen capacity: ${show.screenCapacity ?? "N/A"}`);
    logger.log(`Active Seat count: ${show.activeSeatCount}`);
    logger.log(`Legacy booked labels: ${show.legacyBookedSeatCount}`);
    logger.log(`Existing ShowSeats: ${show.existingShowSeatCount}`);
    logger.log(`Expected ShowSeats: ${show.expectedShowSeatCount}`);
    logger.log(`Proposed writes: ${show.proposedWriteCount}`);
    if (show.mismatchLabels.length) {
        logger.log(`Mismatch labels: ${show.mismatchLabels.join(", ")}`);
    }
    if (show.duplicateLabels.length) {
        logger.log(`Duplicate labels: ${show.duplicateLabels.join(", ")}`);
    }
    if (show.inactiveBookedLabels.length) {
        logger.log(`Inactive booked labels: ${show.inactiveBookedLabels.join(", ")}`);
    }
    if (show.warnings.length) {
        logger.log(`Warnings: ${show.warnings.join("; ")}`);
    }
    if (show.errorMessage) {
        logger.log(`Error: ${show.errorMessage}`);
    }
};

const printSummary = ({ logger, summary, reportPath }) => {
    logger.log("Summary:");
    logger.log(`Total Shows audited: ${summary.totalShowsAudited}`);
    CLASSIFICATIONS.forEach((classification) => {
        logger.log(`${classification}: ${summary.classificationCounts[classification] || 0}`);
    });
    logger.log(`Total proposed ShowSeat documents: ${summary.totalProposedShowSeatDocuments}`);
    logger.log(`Total expected ShowSeat documents: ${summary.totalExpectedShowSeatDocuments}`);
    logger.log(`Total existing ShowSeat documents: ${summary.totalExistingShowSeatDocuments}`);
    logger.log(`Total legacy booked seat labels: ${summary.totalLegacyBookedSeatLabels}`);
    logger.log(`Total Shows with warnings: ${summary.showsWithWarnings}`);
    logger.log(`Total Shows eligible for future apply: ${summary.eligibleForFutureApply}`);
    logger.log(`Total Shows skipped: ${summary.skipped}`);
    logger.log(`Report file: ${reportPath}`);
    logger.log("DRY RUN - NO SHOWSEAT DOCUMENTS WERE CREATED");
};

const loadShows = async (Show) => (
    Show.find({})
        .populate("movie", "title movieName name")
        .populate("theatre", "name")
        .populate("screen", "name screenNumber")
        .sort({ date: 1, time: 1, _id: 1 })
);

const loadShowById = async (Show, showId, options = {}) => (
    Show.findById(showId, null, options)
        .populate("movie", "title movieName name")
        .populate("theatre", "name")
        .populate("screen", "name screenNumber")
);

const auditShows = async ({
    Show,
    auditShowSeatInitialization,
    logger = console,
    printDetails = true,
}) => {
    const shows = await loadShows(Show);
    const auditedShows = [];

    for (const show of shows) {
        try {
            const auditResult = await auditShowSeatInitialization(show);
            const serialized = serializeAuditResult({ show, auditResult });
            auditedShows.push(serialized);
            if (printDetails) {
                printShowReport({ logger, show: serialized });
            }
        } catch (error) {
            const serialized = serializeAuditResult({
                show,
                auditResult: {
                    classification: SHOW_SEAT_AUDIT_CLASSIFICATION.OTHER_ERROR,
                    showId: getDocumentId(show),
                    screenId: getDocumentId(show.screen),
                    screenCapacity: null,
                    activeSeatCount: 0,
                    legacyBookedSeatCount: Array.isArray(show.bookedSeats) ? show.bookedSeats.length : 0,
                    existingShowSeatCount: 0,
                    expectedShowSeatCount: 0,
                    proposedWriteCount: 0,
                    mismatchLabels: [],
                    duplicateLabels: [],
                    inactiveBookedLabels: [],
                    warnings: [error.message],
                    error,
                },
            });
            auditedShows.push(serialized);
            if (printDetails) {
                printShowReport({ logger, show: serialized });
            }
        }
    }

    return auditedShows;
};

const unsafeApplyClassifications = new Set([
    SHOW_SEAT_AUDIT_CLASSIFICATION.INCOMPLETE_SCREEN_LAYOUT,
    SHOW_SEAT_AUDIT_CLASSIFICATION.NO_ACTIVE_SEATS,
    SHOW_SEAT_AUDIT_CLASSIFICATION.LEGACY_BOOKED_SEAT_MISMATCH,
    SHOW_SEAT_AUDIT_CLASSIFICATION.DUPLICATE_BOOKED_SEAT_LABEL,
    SHOW_SEAT_AUDIT_CLASSIFICATION.INACTIVE_BOOKED_SEAT,
    SHOW_SEAT_AUDIT_CLASSIFICATION.OTHER_ERROR,
]);

const assertApplyPreflightSafe = (summary) => {
    const blocked = [...unsafeApplyClassifications].filter(
        (classification) => summary.classificationCounts[classification] > 0
    );

    if (blocked.length > 0) {
        throw new Error(`Apply blocked by unsafe classifications: ${blocked.join(", ")}`);
    }
};

const hasIndex = (indexes, key, options = {}) => indexes.some((index) => (
    JSON.stringify(index.key) === JSON.stringify(key)
    && (!options.unique || index.unique === true)
));

const ensureShowSeatIndexes = async (ShowSeat) => {
    await ShowSeat.createIndexes();
    const indexes = await ShowSeat.collection.indexes();

    if (!hasIndex(indexes, { show: 1, seat: 1 }, { unique: true })) {
        throw new Error("Required unique ShowSeat index { show: 1, seat: 1 } is missing.");
    }
    if (!hasIndex(indexes, { show: 1, status: 1 })) {
        throw new Error("Required ShowSeat index { show: 1, status: 1 } is missing.");
    }
    if (!hasIndex(indexes, { show: 1, seatNumber: 1 })) {
        throw new Error("Required ShowSeat index { show: 1, seatNumber: 1 } is missing.");
    }
};

const assertTransactionSupport = async ({ mongoose, ShowSeat }) => {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            await ShowSeat.exists({ _id: null }).session(session);
        });
    } catch (error) {
        throw new Error(`MongoDB transactions are required for apply mode: ${error.message}`);
    } finally {
        await session.endSession();
    }
};

const createApplySummary = (preApplySummary, startedAt) => ({
    totalShowsAuditedBeforeApply: preApplySummary.totalShowsAudited,
    readyBeforeApply: preApplySummary.classificationCounts[SHOW_SEAT_AUDIT_CLASSIFICATION.READY],
    alreadyInitializedBeforeApply: preApplySummary.classificationCounts[SHOW_SEAT_AUDIT_CLASSIFICATION.ALREADY_INITIALIZED],
    showsMigrated: 0,
    showsAlreadyInitialized: 0,
    showsFailed: 0,
    showSeatsInserted: 0,
    bookedShowSeatsCreated: 0,
    availableShowSeatsCreated: 0,
    totalFinalShowSeatCount: 0,
    elapsedMs: 0,
    startedAt: startedAt.toISOString(),
    completedAt: null,
});

const buildApplyReport = ({
    generatedAt,
    databaseName,
    preApplySummary,
    applySummary,
    shows,
}) => ({
    metadata: {
        generatedAt: generatedAt.toISOString(),
        mode: "APPLY",
        databaseName,
        script: "backfillShowSeats.js",
        startedAt: applySummary.startedAt,
        completedAt: applySummary.completedAt,
    },
    preApplySummary,
    summary: applySummary,
    shows,
});

const formatDuration = (milliseconds) => {
    if (milliseconds < 1000) {
        return `${milliseconds}ms`;
    }

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
        return `${(milliseconds / 1000).toFixed(2)}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
};

const logApplyProgressSummary = ({ logger, processed, total, applySummary, startedAt }) => {
    const elapsedMs = Date.now() - startedAt.getTime();
    logger.log(
        `Processed: ${processed}/${total} | Migrated this run: ${applySummary.showsMigrated} | `
        + `Already initialized: ${applySummary.showsAlreadyInitialized} | Failed: ${applySummary.showsFailed} | `
        + `ShowSeats inserted this run: ${applySummary.showSeatsInserted} | Elapsed: ${formatDuration(elapsedMs)}`
    );
};

const registerInterruptMessage = (logger = console, targetProcess = process) => {
    const handler = (signal) => {
        logger.log("Migration interruption requested.");
        logger.log("Current in-flight Show transaction will not be treated as successfully migrated unless committed.");
        logger.log("Re-run DRY_RUN before resuming APPLY.");
        targetProcess.removeListener("SIGINT", handler);
        targetProcess.removeListener("SIGTERM", handler);
        targetProcess.kill(targetProcess.pid, signal);
    };

    targetProcess.once("SIGINT", handler);
    targetProcess.once("SIGTERM", handler);
};

const runShowSeatDryRunAudit = async ({
    Show,
    auditShowSeatInitialization,
    logger = console,
    generatedAt = new Date(),
    databaseName = null,
    reportDir = REPORT_DIR,
}) => {
    const auditedShows = await auditShows({
        Show,
        auditShowSeatInitialization,
        logger,
        printDetails: true,
    });
    const report = buildReport({ shows: auditedShows, generatedAt, databaseName, mode: "DRY_RUN" });
    const reportPath = createReportPath(generatedAt, reportDir);
    writeJsonReport(report, reportPath);
    printSummary({ logger, summary: report.summary, reportPath });

    return {
        ...report,
        reportPath,
    };
};

const runShowSeatApply = async ({
    mongoose,
    Show,
    ShowSeat,
    auditShowSeatInitialization,
    initializeShowSeats,
    logger = console,
    generatedAt = new Date(),
    databaseName = null,
    reportDir = REPORT_DIR,
}) => {
    const startedAt = new Date();
    const preApplyShows = await auditShows({
        Show,
        auditShowSeatInitialization,
        logger,
        printDetails: false,
    });
    const preApplySummary = summarizeShows(preApplyShows);
    assertApplyPreflightSafe(preApplySummary);
    await ensureShowSeatIndexes(ShowSeat);
    await assertTransactionSupport({ mongoose, ShowSeat });

    const applySummary = createApplySummary(preApplySummary, startedAt);
    const applyShows = [];
    let failure = null;
    const totalShows = preApplyShows.length;

    for (let index = 0; index < preApplyShows.length; index += 1) {
        const showAudit = preApplyShows[index];
        const position = index + 1;
        const showResult = {
            showId: showAudit.showId,
            screenId: showAudit.screenId,
            initialClassification: showAudit.classification,
            applyResult: null,
            expectedCount: showAudit.expectedShowSeatCount,
            persistedCount: showAudit.existingShowSeatCount,
            bookedCount: 0,
            error: null,
        };

        if (showAudit.classification === SHOW_SEAT_AUDIT_CLASSIFICATION.ALREADY_INITIALIZED) {
            showResult.applyResult = "ALREADY_INITIALIZED";
            applySummary.showsAlreadyInitialized += 1;
            applyShows.push(showResult);
            logger.log(`[${position}/${totalShows}] Show ${showAudit.showId} - ALREADY_INITIALIZED - ${showAudit.existingShowSeatCount} seats`);
            if (position % 10 === 0 || position === totalShows) {
                logApplyProgressSummary({ logger, processed: position, total: totalShows, applySummary, startedAt });
            }
            continue;
        }

        const session = await mongoose.startSession();
        const showStartedAt = Date.now();
        logger.log(`[${position}/${totalShows}] Show ${showAudit.showId} - MIGRATING - expected ${showAudit.expectedShowSeatCount} seats`);
        try {
            await session.withTransaction(async () => {
                const currentShow = await loadShowById(Show, showAudit.showId, { session });
                const initializationResult = await initializeShowSeats(currentShow, { session });

                showResult.expectedCount = initializationResult.expectedShowSeatCount;
                showResult.persistedCount = initializationResult.persistedCount || initializationResult.existingShowSeatCount || 0;

                if (initializationResult.classification === SHOW_SEAT_AUDIT_CLASSIFICATION.ALREADY_INITIALIZED) {
                    showResult.applyResult = "ALREADY_INITIALIZED";
                    return;
                }

                if (!initializationResult.initialized) {
                    throw new Error(
                        `Show ${showAudit.showId} was not initialized; classification ${initializationResult.classification}`
                    );
                }

                const bookedCount = await ShowSeat.countDocuments({
                    show: showAudit.showId,
                    status: "BOOKED",
                }).session(session);
                showResult.bookedCount = bookedCount;
                showResult.applyResult = "MIGRATED";
                showResult.persistedCount = initializationResult.persistedCount;
                applySummary.showSeatsInserted += initializationResult.insertedCount;
                applySummary.bookedShowSeatsCreated += bookedCount;
                applySummary.availableShowSeatsCreated += initializationResult.insertedCount - bookedCount;
            });

            if (showResult.applyResult === "MIGRATED") {
                applySummary.showsMigrated += 1;
                logger.log(
                    `[${position}/${totalShows}] Show ${showAudit.showId} - MIGRATED - `
                    + `${showResult.persistedCount} seats - ${formatDuration(Date.now() - showStartedAt)}`
                );
            } else if (showResult.applyResult === "ALREADY_INITIALIZED") {
                applySummary.showsAlreadyInitialized += 1;
                logger.log(`[${position}/${totalShows}] Show ${showAudit.showId} - ALREADY_INITIALIZED - ${showResult.persistedCount} seats`);
            }
            applyShows.push(showResult);
            if (position % 10 === 0 || position === totalShows) {
                logApplyProgressSummary({ logger, processed: position, total: totalShows, applySummary, startedAt });
            }
        } catch (error) {
            showResult.applyResult = "FAILED";
            showResult.error = error.message;
            applySummary.showsFailed += 1;
            applyShows.push(showResult);
            logger.log(`[${position}/${totalShows}] Show ${showAudit.showId} - FAILED - ${error.message}`);
            logApplyProgressSummary({ logger, processed: position, total: totalShows, applySummary, startedAt });
            failure = error;
            break;
        } finally {
            await session.endSession();
        }
    }

    if (failure) {
        const completedAt = new Date();
        applySummary.completedAt = completedAt.toISOString();
        applySummary.elapsedMs = completedAt.getTime() - startedAt.getTime();
        const report = buildApplyReport({
            generatedAt,
            databaseName,
            preApplySummary,
            applySummary,
            shows: applyShows,
        });
        const reportPath = createReportPath(generatedAt, reportDir);
        writeJsonReport(report, reportPath);
        logger.log(`APPLY FAILED - Report file: ${reportPath}`);
        throw failure;
    }

    const finalShows = await auditShows({
        Show,
        auditShowSeatInitialization,
        logger,
        printDetails: false,
    });
    const finalSummary = summarizeShows(finalShows);
    if (finalSummary.classificationCounts[SHOW_SEAT_AUDIT_CLASSIFICATION.READY] !== 0
        || finalSummary.classificationCounts[SHOW_SEAT_AUDIT_CLASSIFICATION.ALREADY_INITIALIZED] !== finalSummary.totalShowsAudited) {
        throw new Error("Final verification failed: not all Shows are ALREADY_INITIALIZED.");
    }

    applySummary.totalFinalShowSeatCount = await ShowSeat.countDocuments({});
    if (applySummary.totalFinalShowSeatCount !== preApplySummary.totalExpectedShowSeatDocuments) {
        throw new Error(
            `Final ShowSeat count ${applySummary.totalFinalShowSeatCount} does not match expected ${preApplySummary.totalExpectedShowSeatDocuments}.`
        );
    }

    const finalBookedCount = await ShowSeat.countDocuments({ status: "BOOKED" });
    if (finalBookedCount !== preApplySummary.totalLegacyBookedSeatLabels) {
        throw new Error(
            `Final BOOKED ShowSeat count ${finalBookedCount} does not match expected ${preApplySummary.totalLegacyBookedSeatLabels}.`
        );
    }

    const completedAt = new Date();
    applySummary.completedAt = completedAt.toISOString();
    applySummary.elapsedMs = completedAt.getTime() - startedAt.getTime();

    const report = buildApplyReport({
        generatedAt,
        databaseName,
        preApplySummary,
        applySummary,
        shows: applyShows,
    });
    const reportPath = createReportPath(generatedAt, reportDir);
    writeJsonReport(report, reportPath);
    logger.log(`APPLY COMPLETE - Report file: ${reportPath}`);

    return {
        ...report,
        reportPath,
    };
};

const backfillShowSeats = async () => {
    require("dotenv").config();
    const { mode } = parseArgs(process.argv.slice(2));

    const mongoose = require("mongoose");
    const connectDB = require("../config/db");
    require("../models/movieSchema");
    require("../models/theatreSchema");
    require("../models/screenSchema");
    require("../models/seatSchema");
    const ShowSeat = require("../models/showSeatSchema");
    const Show = require("../models/showSchema");
    const {
        auditShowSeatInitialization,
        initializeShowSeats,
    } = require("../services/showSeatService");

    await connectDB();
    const databaseName = mongoose.connection.name || "unknown";
    console.log(`Mode: ${mode}`);
    console.log(`Database: ${databaseName}`);
    if (mode === "APPLY") {
        registerInterruptMessage(console);
        await runShowSeatApply({
            mongoose,
            Show,
            ShowSeat,
            auditShowSeatInitialization,
            initializeShowSeats,
            databaseName,
        });
    } else {
        await runShowSeatDryRunAudit({
            Show,
            auditShowSeatInitialization,
            databaseName,
        });
    }
    await mongoose.connection.close();
};

if (require.main === module) {
    backfillShowSeats().catch(async (error) => {
        const mongoose = require("mongoose");
        console.error("ShowSeat dry-run audit failed:", error.message);
        await mongoose.connection.close();
        process.exit(1);
    });
}

module.exports = {
    REPORT_DIR,
    UNSUPPORTED_WRITE_FLAGS,
    CLASSIFICATIONS,
    getDocumentId,
    parseArgs,
    createSummary,
    serializeAuditResult,
    summarizeShows,
    buildReport,
    buildApplyReport,
    formatDuration,
    logApplyProgressSummary,
    registerInterruptMessage,
    createReportPath,
    auditShows,
    assertApplyPreflightSafe,
    ensureShowSeatIndexes,
    assertTransactionSupport,
    runShowSeatDryRunAudit,
    runShowSeatApply,
};
