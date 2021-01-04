"use strict";
const uninitializedStripe = require("stripe");
const controllerUtils = require("../admin/src/utils/controllerUtils");
require("dotenv").config();
/**
 * stripe.js controller
 *
 * @description: A set of functions called "actions" of the `stripe` plugin.
 */

module.exports = {
  /**
   * Default action.
   *
   * @return {Object}
   */

  index: async (ctx) => {
    // Add your own logic here.

    // Send 200 `ok`
    ctx.send({
      message: "ok",
    });
  },

  updateSettings: async (ctx) => {
    const { user } = ctx.state;
    const { pk, plans, whs } = ctx.request.body;

    // Ensure user is admin here
    if (user.roles[0].name !== "Super Admin") {
      return ctx.unauthorized("Only administrators allowed!");
    }

    if (!pk || plans.length <= 0 || !whs) {
      return ctx.throw(400, "Please make sure all fields are filled correctly");
    }

    const pluginStore = controllerUtils.getStore();

    const setValues = async (key, allPlans, secret) => {
      await pluginStore.set({ key: "pk", value: key });
      await pluginStore.set({ key: "whs", value: secret });
      await pluginStore.set({ key: "plans", value: allPlans });
    };

    const result = await setValues(pk, plans, whs);

    ctx.send({ result });
  },

  retrieveSettings: async (ctx) => {
    const { user } = ctx.state;

    // Ensure user is admin here
    if (user.roles[0].name !== "Super Admin") {
      return ctx.unauthorized("Only administrators allowed!");
    }

    const pluginStore = controllerUtils.getStore();

    const getStripeSettings = async (key1, key2, key3) => {
      const pk = await pluginStore.get({ key: key1 });
      const plans = await pluginStore.get({ key: key2 });
      const whs = await pluginStore.get({ key: key3 });

      return {
        pk,
        whs,
        plans,
      };
    };

    const { pk, plans, whs } = await getStripeSettings("pk", "plans");

    ctx.send({
      pk: pk ? pk : "",
      plans: plans.length ? plans : [],
      whs: whs ? whs : "",
    });
  },

  webhooks: async (ctx) => {
    const pluginStore = controllerUtils.getStore();

    const pk = await pluginStore.get({ key: "pk" });
    const whs = await pluginStore.get({ key: "whs" });
    const stripe = uninitializedStripe(pk);

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        ctx.request.body,
        ctx.request.headers["stripe-signature"],
        whs
      );
    } catch (error) {
      console.error(error);
      ctx.send(error.toString());
    }

    const dataObj = event.data.object;

    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // Remove comment to see the various objects sent for this sample
    switch (event.type) {
      case "invoice.paid":
        // Used to provision services after the trial has ended.
        // The status of the invoice will show up as paid. Store the status in your
        // database to reference when a user accesses your service to avoid hitting rate limits.
        break;
      case "invoice.payment_failed":
        // If the payment fails or the customer does not have a valid payment method,
        //  an invoice.payment_failed event is sent, the subscription becomes past_due.
        // Use this webhook to notify your user that their payment has
        // failed and to retrieve new card details.
        break;
      case "invoice.finalized":
        // If you want to manually send out invoices to your customers
        // or store them locally to reference to avoid hitting Stripe rate limits.
        break;
      case "customer.subscription.deleted":
        if (event.request != null) {
          // handle a subscription cancelled by your request
          // from above.
        } else {
          // handle subscription cancelled automatically based
          // upon your subscription settings.
        }
        break;
      case "customer.subscription.trial_will_end":
        // Send notification to your user that the trial will end
        break;
      default:
      // Unexpected event type
    }
    ctx.send({ message: "Success" });
  },
};
