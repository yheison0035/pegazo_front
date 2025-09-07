export const Views = {
  CUSTOMERS: "customers",
};

export const getWiew = (key) => {
  return Views[key] || null;
};
