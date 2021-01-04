module.exports = {
  getStore: () => {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: "plugin",
      name: "spillzit-stripe",
    });
    return pluginStore;
  },
  getPlanById: (plans, id) => {
    const plan = plans.find((plan) => plan.price_id === id);
    return plan;
  },
};
