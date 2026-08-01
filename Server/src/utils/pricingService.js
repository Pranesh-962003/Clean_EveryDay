const DELIVERY_OPTIONS = {

    FREE: {

        title: "Free",

        charge: 0,

        estimatedDays: 5

    },

    STANDARD: {

        title: "STANDARD",

        charge: 99,

        estimatedDays: 2

    },

    EXPRESS: {

        title: "EXPRESS",

        charge: 199,

        estimatedDays: 1

    }

};

export const calculateOrderPricing = ({

    cartItems,

    deliveryOption,

    couponCode

}) => {

    let subtotal = 0;

    let discount = 0;

    cartItems.forEach(item => {

        subtotal +=

            item.product.sellingPrice *

            item.quantity;

        discount +=

            (item.product.retailPrice -

                item.product.sellingPrice) *

            item.quantity;

    });

    const selectedDelivery =

        DELIVERY_OPTIONS[deliveryOption];

    if (!selectedDelivery) {

        throw new Error("Invalid delivery option.");

    }

    const gstPercentage = 18;

    const gstAmount = Math.round(

        subtotal * (gstPercentage / 100)

    );

    const couponDiscount = 0;

    const grandTotal =

        subtotal +

        gstAmount +

        selectedDelivery.charge -

        couponDiscount;

    return {

        subtotal,

        discount,

        couponDiscount,

        tax: {

            percentage: gstPercentage,

            amount: gstAmount

        },

        delivery: {

            option: deliveryOption,

            title: selectedDelivery.title,

            charge: selectedDelivery.charge,

            estimatedDays:

                selectedDelivery.estimatedDays

        },

        grandTotal

    };

};