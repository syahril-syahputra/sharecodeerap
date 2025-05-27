const XLSX = require("xlsx");

module.exports = generateXlsx = (data) => {
    const headerStyle = {
        font: { bold: true, color: { rgb: "FF0000" } }, // Red font color
        alignment: { horizontal: "left" },
        fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background color
    };

    // Apply styles to headers

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    worksheet["!cols"] = [];
    // console.log(Object.keys(data[0]));
    Object.keys(data[0]).forEach((key) => {
        worksheet[key + "1"] = { ...headerStyle };
        worksheet["!cols"].push({ wch: key.length + 15, level: 1 }); // Adjust column width
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Write the workbook to a buffer
    return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
};
