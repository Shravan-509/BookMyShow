const loadRepository = () => {
    jest.resetModules();

    const sort = jest.fn().mockReturnValue("sorted-query");
    const lean = jest.fn().mockReturnValue("lean-query");
    const ShowSeat = {
        find: jest.fn().mockReturnValue({ sort, lean }),
        findOne: jest.fn().mockReturnValue("find-one-query"),
        countDocuments: jest.fn().mockReturnValue("count-query"),
        insertMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockReturnValue("delete-query"),
    };

    jest.doMock("../../models/showSeatSchema", () => ShowSeat);

    return {
        repository: require("../../repositories/showSeatRepository"),
        ShowSeat,
        sort,
        lean,
    };
};

describe("showSeatRepository", () => {
    test("queries ShowSeats by Show in row and column order", () => {
        const { repository, ShowSeat, sort } = loadRepository();

        const result = repository.findByShow("show-1");

        expect(result).toBe("sorted-query");
        expect(ShowSeat.find).toHaveBeenCalledWith({ show: "show-1" }, null, {});
        expect(sort).toHaveBeenCalledWith({ row: 1, column: 1 });
    });

    test("queries projected ShowSeat availability without populating", () => {
        const { repository, ShowSeat, lean } = loadRepository();

        const result = repository.findAvailabilityByShow("show-1");

        expect(result).toBe("lean-query");
        expect(ShowSeat.find).toHaveBeenCalledWith(
            { show: "show-1" },
            "_id seat seatNumber row column seatType status",
            {}
        );
        expect(lean).toHaveBeenCalledTimes(1);
    });

    test("queries ShowSeats by Show and status in row and column order", () => {
        const { repository, ShowSeat, sort } = loadRepository();

        const result = repository.findByShowAndStatus("show-1", "AVAILABLE");

        expect(result).toBe("sorted-query");
        expect(ShowSeat.find).toHaveBeenCalledWith(
            { show: "show-1", status: "AVAILABLE" },
            null,
            {}
        );
        expect(sort).toHaveBeenCalledWith({ row: 1, column: 1 });
    });

    test("counts ShowSeats by Show", () => {
        const { repository, ShowSeat } = loadRepository();

        const result = repository.countByShow("show-1");

        expect(result).toBe("count-query");
        expect(ShowSeat.countDocuments).toHaveBeenCalledWith({ show: "show-1" }, {});
    });

    test("finds a ShowSeat by Show and physical Seat", () => {
        const { repository, ShowSeat } = loadRepository();

        const result = repository.findByShowAndSeat("show-1", "seat-1");

        expect(result).toBe("find-one-query");
        expect(ShowSeat.findOne).toHaveBeenCalledWith(
            { show: "show-1", seat: "seat-1" },
            null,
            {}
        );
    });

    test("passes session-capable options to read operations", () => {
        const { repository, ShowSeat } = loadRepository();
        const options = { session: "session-1" };

        repository.findByShow("show-1", options);
        repository.findAvailabilityByShow("show-1", options);
        repository.findByShowAndStatus("show-1", "BOOKED", options);
        repository.countByShow("show-1", options);
        repository.findByShowAndSeat("show-1", "seat-1", options);

        expect(ShowSeat.find).toHaveBeenNthCalledWith(1, { show: "show-1" }, null, options);
        expect(ShowSeat.find).toHaveBeenNthCalledWith(
            2,
            { show: "show-1" },
            "_id seat seatNumber row column seatType status",
            options
        );
        expect(ShowSeat.find).toHaveBeenNthCalledWith(
            3,
            { show: "show-1", status: "BOOKED" },
            null,
            options
        );
        expect(ShowSeat.countDocuments).toHaveBeenCalledWith({ show: "show-1" }, options);
        expect(ShowSeat.findOne).toHaveBeenCalledWith(
            { show: "show-1", seat: "seat-1" },
            null,
            options
        );
    });

    test("inserts many ShowSeats with ordered writes and optional session", async () => {
        const { repository, ShowSeat } = loadRepository();
        const payloads = [{ show: "show-1", seat: "seat-1" }];

        await repository.insertMany(payloads, { session: "session-1" });

        expect(ShowSeat.insertMany).toHaveBeenCalledWith(payloads, {
            ordered: true,
            session: "session-1",
        });
    });

    test("deletes ShowSeats by Show with optional session", () => {
        const { repository, ShowSeat } = loadRepository();

        const result = repository.deleteByShow("show-1", { session: "session-1" });

        expect(result).toBe("delete-query");
        expect(ShowSeat.deleteMany).toHaveBeenCalledWith(
            { show: "show-1" },
            { session: "session-1" }
        );
    });
});
