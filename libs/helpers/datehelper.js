const datehelper = {

    isBetweenDates: (start, end, date) => {
        if (date > start && date < end) {
            return true;
        } else {
            return false;
        }
    },

    calculateAge: (birthday) => {
        const birthdate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthdate.getFullYear();
        const monthDifference = today.getMonth() - birthdate.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
            age--;
        }

        return age;
    },

    lastWeekRanges: () => {
        const currentDate = new Date();
        const dateObjects = [];

        for (let i = 0; i < 7; i++) {
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i, 0, 0, 0, 0);
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i, 23, 59, 59, 999);
            const dateObject = {
                startDate,
                endDate
            };
            dateObjects.push(dateObject);
        }
        return dateObjects.reverse();
    }


}
module.exports = datehelper;