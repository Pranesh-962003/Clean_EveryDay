export const generateTransactionId = () => {

    const timestamp = Date.now();

    const random = Math.floor(

        100000 + Math.random() * 900000

    );

    return `TXN-${timestamp}${random}`;

};