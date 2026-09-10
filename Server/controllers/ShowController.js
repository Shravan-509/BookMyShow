const mongoose = require("mongoose");
const Show = require("../models/showSchema");
const Theatre = require("../models/theatreSchema");
const screenService = require("../services/screenService");
const showSeatService = require("../services/showSeatService");
const showSeatRepository = require("../repositories/showSeatRepository");
const AppError = require("../utils/AppError");

const withSession = (query, session) => (
    session && typeof query.session === "function" ? query.session(session) : query
);

const isTransactionSupportError = (error) => {
    const message = String(error?.message || "").toLowerCase();
    return message.includes("transaction numbers are only allowed")
        || message.includes("replica set member or mongos")
        || message.includes("transactions are not supported")
        || message.includes("transaction not supported");
};

const runInTransaction = async (work) => {
    const session = await mongoose.startSession();

    try {
        let result;
        await session.withTransaction(async () => {
            result = await work(session);
        });
        return result;
    } catch (error) {
        if (!error?.isOperational && isTransactionSupportError(error)) {
            throw new AppError(
                "Screen-aware Show operations require MongoDB transaction support",
                500,
                "SHOW_TRANSACTION_REQUIRED"
            );
        }

        throw error;
    } finally {
        session.endSession();
    }
};

const canManageTheatre = async (req, theatreId, { session = null } = {}) => {
    const theatre = await withSession(Theatre.findById(theatreId).select("owner"), session)

    if(!theatre)
    {
        return { allowed: false, status: 404, message: "Theatre not found" }
    }

    if(req.user?.role === "partner" && theatre.owner?.toString() !== req.userId.toString())
    {
        return { allowed: false, status: 403, message: "Access denied" }
    }

    return { allowed: true, theatre }
}

const buildShowPayload = async (req, existingShow = {}, options = {}) => {
    const targetTheatre = req.body.theatre || existingShow.theatre;
    const theatreChanged = req.body.theatre
        && existingShow.theatre
        && req.body.theatre.toString() !== existingShow.theatre.toString();
    const showPayload = {
        ...req.body,
        theatre: targetTheatre,
    };

    if (Object.prototype.hasOwnProperty.call(req.body, "screen")) {
        if (req.body.screen) {
            const screen = await screenService.ensureActiveScreenForTheatre(req, {
                screenId: req.body.screen,
                theatreId: showPayload.theatre,
            }, options);
            showPayload.totalSeats = screen.capacity;
        } else {
            delete showPayload.screen;
        }
    } else if (theatreChanged && existingShow.screen) {
        throw new AppError("A compatible screen is required when changing theatre for a screen-aware show", 400, "SCREEN_REQUIRED_FOR_THEATRE_CHANGE");
    }

    return showPayload;
};

const screenChanged = (incomingScreen, existingScreen) => {
    const currentScreen = existingScreen?._id || existingScreen;
    const nextScreen = incomingScreen?._id || incomingScreen;
    return String(nextScreen || "") !== String(currentScreen || "");
};

const assertScreenLayoutReady = async (show, options = {}) => {
    const auditResult = await showSeatService.auditShowSeatInitialization(show, options);
    const classification = auditResult.classification;
    const classifications = showSeatService.SHOW_SEAT_AUDIT_CLASSIFICATION;

    if (classification === classifications.READY) {
        return auditResult;
    }

    if (classification === classifications.NO_ACTIVE_SEATS) {
        throw new AppError("Screen has no active Seats", 409, "SCREEN_HAS_NO_ACTIVE_SEATS");
    }

    if (classification === classifications.INCOMPLETE_SCREEN_LAYOUT) {
        throw new AppError("Screen Seat layout is incomplete", 409, "SCREEN_LAYOUT_INCOMPLETE");
    }

    if (classification === classifications.ALREADY_INITIALIZED) {
        throw new AppError("ShowSeat inventory already exists for this Show", 409, "SHOWSEAT_ALREADY_INITIALIZED");
    }

    throw new AppError("ShowSeat inventory could not be initialized", 500, "SHOWSEAT_INITIALIZATION_FAILED");
};

const initializeScreenAwareShow = async (req, showPayload) => (
    runInTransaction(async (session) => {
        const transactionPayload = await buildShowPayload(req, {}, { session });
        const show = new Show({
            ...showPayload,
            ...transactionPayload,
            bookedSeats: [],
        });

        await assertScreenLayoutReady(show, { session });
        await show.save({ session });

        const initializationResult = await showSeatService.initializeShowSeats(show, { session });
        if (!initializationResult.initialized) {
            throw new AppError(
                "ShowSeat inventory could not be initialized",
                500,
                "SHOWSEAT_INITIALIZATION_FAILED"
            );
        }

        if (initializationResult.persistedCount !== show.totalSeats) {
            throw new AppError(
                "ShowSeat inventory count does not match Show capacity",
                500,
                "SHOWSEAT_INITIALIZATION_FAILED"
            );
        }

        return show;
    })
);

const addShow = async(req, res, next) => {
    try {
        const {name} = req?.body;
        const access = await canManageTheatre(req, req.body.theatre)

        if(!access.allowed)
        {
            return res.status(access.status).json({
                success: false,
                message: access.message,
            })
        }

        const hasScreen = Boolean(req.body.screen);
        if (hasScreen) {
            await initializeScreenAwareShow(req, req.body);
        } else {
            const showPayload = await buildShowPayload(req);
            const newShow = new Show(showPayload);
            await newShow.save();
        }

        return res.send({
                success: true,
                message: `${name} has been added`
            });
    } catch (error) {
        res.status(400);
        next(error);
    }
};


const updateShow = async(req, res, next) => {
    try 
    {
        const {name} = req?.body;
        const existingShow = await Show.findById(req?.params?.id).select("theatre screen")

        if(!existingShow)
        {
            return res.send({
                    success: false,
                    message: `${name} not found`,
                });
        }

        const currentTheatreAccess = await canManageTheatre(req, existingShow.theatre)

        if(!currentTheatreAccess.allowed)
        {
            return res.status(currentTheatreAccess.status).json({
                success: false,
                message: currentTheatreAccess.message,
            })
        }

        if(req.body.theatre && req.body.theatre.toString() !== existingShow.theatre.toString())
        {
            const targetTheatreAccess = await canManageTheatre(req, req.body.theatre)

            if(!targetTheatreAccess.allowed)
            {
                return res.status(targetTheatreAccess.status).json({
                    success: false,
                    message: targetTheatreAccess.message,
                })
            }
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "screen")
            && screenChanged(req.body.screen, existingShow.screen)
        ) {
            const existingShowSeatCount = await showSeatRepository.countByShow(existingShow._id);
            if (existingShowSeatCount > 0) {
                throw new AppError(
                    "Show screen cannot be changed after ShowSeat inventory has been initialized",
                    409,
                    "SHOW_SCREEN_CHANGE_NOT_ALLOWED_AFTER_INVENTORY"
                );
            }
        }

        const showPayload = await buildShowPayload(req, existingShow);

        const updatedShow = await Show.findByIdAndUpdate(
            req?.params?.id, 
            showPayload,
            {
                returnDocument: "after",
                runValidators: true
            }
        ).populate("screen", "name screenNumber capacity theatre isActive");
        if(!updatedShow)
        {
            return res.send({
                    success: false,
                    message: `${name} not found`,
                });
        }
        return res.send({
            success: true,
            message: `${name} has been updated`,
            data: updatedShow
        });
        
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const deleteShow = async(req, res, next) => {
    try
    {
        const show = await Show.findById(req?.params?.id).select("theatre")

        if(!show)
        {
            return res.send({
                    success: false,
                    message: "Show not found",
                });
        }

        const access = await canManageTheatre(req, show.theatre)

        if(!access.allowed)
        {
            return res.status(access.status).json({
                success: false,
                message: access.message,
            })
        }

        const existingShowSeatCount = await showSeatRepository.countByShow(show._id);
        const deletedShow = existingShowSeatCount > 0
            ? await runInTransaction(async (session) => {
                await showSeatRepository.deleteByShow(show._id, { session });
                return Show.findByIdAndDelete(req?.params?.id, { session });
            })
            : await Show.findByIdAndDelete(req?.params?.id);
        if(!deletedShow)
        {
            return res.send({
                    success: false,
                    message: "Show not found",
                });
        }
        return res.send({
            success: true,
            message: "Show deleted successfully"
        })

        
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const getShowById = async(req, res, next) => {
    try 
    {
        const shows = await Show.findById(req.params.id)
            .populate("movie")
            .populate("theatre")
            .populate("screen", "name screenNumber capacity theatre isActive");
        
        if(!shows)
        {
            return res.send({
                success: false,
                message: "Show not found!"
            });
        }
    
        return res.send({
                success: true,
                message: "Show Details Fetched",
                data: shows
            });
    } catch (error) {
        res.status(400);
        next(error);
    }
};

// When Partners gets Theatre shows
const getAllShowsByTheatre = async(req, res, next) => {
    try
    {
        const theatreId = req.params.id;
        const access = await canManageTheatre(req, theatreId)

        if(!access.allowed)
        {
            return res.status(access.status).json({
                success: false,
                message: access.message,
            })
        }

        const shows = await Show.find({theatre: theatreId})
            .populate("movie")
            .populate("screen", "name screenNumber capacity theatre isActive");
        if(!shows)
        {
            return res.send({
                success: false,
                message: `Shows not found`,
            });

        }
        return res.send({
            success: true,
            message: "All shows has been fetched",
            data: shows
        });
        
    } catch (error) {
        res.status(400);
        next(error);
    }
};

// when User selects a movie
const getTheatresWithShowsByMovie = async (req, res, next) => {
  try {
    const { movie, date } = req.body;

    const shows = await Show.find({ movie, date })
      .populate("theatre")
      .populate("screen", "name screenNumber capacity theatre isActive");

    if (!shows.length) {
      return res.send({
        success: true,
        message: "No shows found",
      });
    }

    const theatreMap = new Map();

    shows.forEach((show) => {
      const theatreId = show.theatre._id.toString();

      if (!theatreMap.has(theatreId)) {
        theatreMap.set(theatreId, {
          ...show.theatre._doc,
          shows: [],
        });
      }

      theatreMap.get(theatreId).shows.push(show);
    });

    return res.send({
      success: true,
      message: "All shows have been fetched",
      data: Array.from(theatreMap.values()),
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

module.exports = {
    addShow,
    getShowById,
    updateShow,
    deleteShow,
    getAllShowsByTheatre,
    getTheatresWithShowsByMovie
}
