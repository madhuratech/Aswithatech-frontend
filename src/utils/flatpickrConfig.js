export function createSingleDateConfig(value) {
  return {
    disableMobile: true,
    monthSelectorType: "static",
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d-m-Y",
    defaultDate: value || new Date(),
  };
}
