const createMockResponse = () => {
  const res = {};

  res.statusCode = 200;
  res.headers = {};
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((body) => {
    res.body = body;
    return res;
  });
  res.send = jest.fn((body) => {
    res.body = body;
    return res;
  });
  res.set = jest.fn((name, value) => {
    res.headers[name] = value;
    return res;
  });
  res.setHeader = jest.fn((name, value) => {
    res.headers[name] = value;
    return res;
  });
  res.getHeader = jest.fn((name) => res.headers[name]);

  return res;
};

module.exports = {
  createMockResponse,
};
