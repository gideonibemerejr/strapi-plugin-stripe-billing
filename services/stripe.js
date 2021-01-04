"use strict";
const uninitializedStripe = require("stripe");
const controllerUtils = require("../admin/src/utils/controllerUtils");
/**
 * stripe.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

module.exports = {
  createCustomer: async ({ first_name = "", last_name = "", email = "" }) => {
    const pluginStore = controllerUtils.getStore();

    const pk = await pluginStore.get({ key: "pk" });
    const stripe = uninitializedStripe(pk);

    const customer = await stripe.customers
      .create({
        email: email,
        name: `${first_name} ${last_name}`,
      })
      .catch((error) => console.error(error));

    return customer;
  },
  getCustomerPaymentMethod: async ({ paymentMethodId = "" }) => {
    const pluginStore = controllerUtils.getStore();

    const pk = await pluginStore.get({ key: "pk" });
    const stripe = uninitializedStripe(pk);

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    return paymentMethod;
  },
  createSubscription: async ({
    customerId = "",
    paymentMethodId = "",
    priceId = "",
  }) => {
    const pluginStore = controllerUtils.getStore();

    const pk = await pluginStore.get({ key: "pk" });
    const plans = await pluginStore.get({ key: "plans" });
    const price = await controllerUtils.getPlanById(plans, priceId);
    const stripe = uninitializedStripe(pk);

    let paymentMethod;
    try {
      paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      return console.error(error);
    }

    let updateCustomerDefaultPaymentMethod = await stripe.customers.update(
      customerId,
      {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      }
    );

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price }],
      expand: ["latest_invoice.payment_intent"],
    });

    return subscription;
  },
  cancelSubscription: async ({ subscriptionId = "" }) => {
    const pluginStore = controllerUtils.getStore();

    const pk = await pluginStore.get({ key: "pk" });
    const stripe = uninitializedStripe(pk);

    const deletedSubscription = await stripe.subscriptions.del(subscriptionId);

    return deletedSubscription;
  },
  updateSubscription: async ({ subscriptionId = "", newPriceId = "" }) => {
    const pluginStore = controllerUtils.getStore();
    const pk = await pluginStore.get({ key: "pk" });
    const plans = await pluginStore.get({ key: "plans" });
    const price = await controllerUtils.getPlanById(plans, newPriceId);
    const stripe = uninitializedStripe(pk);

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
        items: [
          {
            id: subscription.items.data[0].id,
            price,
          },
        ],
      }
    );

    return updatedSubscription;
  },
  retryInvoice: async ({
    customerId = "",
    paymentMethodId = "",
    invoiceId = "",
  }) => {
    const pluginStore = controllerUtils.getStore();
    const pk = await pluginStore.get({ key: "pk" });
    const stripe = uninitializedStripe(pk);

    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error) {
      // in case card_decline error
      return console.error(error);
    }

    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ["payment_intent"],
    });
    return invoice;
  },
  getUpcomingInvoice: async ({
    subscriptionId = "",
    customerId = "",
    newPriceId = "",
  }) => {
    const pluginStore = controllerUtils.getStore();
    const pk = await pluginStore.get({ key: "pk" });
    const plans = await pluginStore.get({ key: "plans" });
    const price = await controllerUtils.getPlanById(plans, newPriceId);
    const stripe = uninitializedStripe(pk);

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
      subscription: subscriptionId,
      subscription_items: [
        {
          id: subscription.items.data[0].id,
          deleted: true,
        },
        {
          price,
          deleted: false,
        },
      ],
    });
    return invoice;
  },
};
