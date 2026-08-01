export const generateOrderNumber = () => {

    const random = Math.floor(10000 + Math.random() * 90000);

    return `CE-${random}`;

};