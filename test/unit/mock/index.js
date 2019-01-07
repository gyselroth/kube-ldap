const getResponseMock = () => {
  return {
    send: jest.fn(),
    sendStatus: jest.fn(),
    set: jest.fn(),
  };
};

const getRequestMock = (body, header) => {
  return {
    header: header,
    body: body,
    get: (name) => {
      for (let key in header) {
        if (key.toLocaleLowerCase() === name.toLowerCase()) {
          return header[key];
        }
      }
    },
  };
};

export {getResponseMock, getRequestMock};
