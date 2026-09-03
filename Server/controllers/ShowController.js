const Show = require("../models/showSchema");
const Theatre = require("../models/theatreSchema");
const screenService = require("../services/screenService");
const AppError = require("../utils/AppError");

const canManageTheatre = async (req, theatreId) => {
    const theatre = await Theatre.findById(theatreId).select("owner")

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

const buildShowPayload = async (req, existingShow = {}) => {
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
            });
            showPayload.totalSeats = screen.capacity;
        } else {
            delete showPayload.screen;
        }
    } else if (theatreChanged && existingShow.screen) {
        throw new AppError("A compatible screen is required when changing theatre for a screen-aware show", 400, "SCREEN_REQUIRED_FOR_THEATRE_CHANGE");
    }

    return showPayload;
};

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

        const showPayload = await buildShowPayload(req);
        const newShow = new Show(showPayload);
        await newShow.save();
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

        const deletedShow = await Show.findByIdAndDelete(req?.params?.id);
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
