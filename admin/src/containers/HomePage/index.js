/*
 *
 * HomePage
 *
 */

import React, { memo, useState, useEffect } from "react";
// import PropTypes from 'prop-types';
import pluginId from "../../pluginId";
import { toTitleCase } from "../../utils";
import { request } from "strapi-helper-plugin";

import * as Styled from "../../components/StrapiStyled";
import { InputText, Button, Padded } from "@buffetjs/core";
const HomePage = () => {
  const [pk, setPk] = useState("");
  const [whs, setWhs] = useState("");
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const loadStripeSettings = async () => {
      const res = await request(`/${pluginId}/settings`, {
        method: "GET",
      });

      const { pk, plans, whs } = res;

      setPk(pk);
      setPlans(plans);
      setWhs(whs);
    };

    loadStripeSettings();
  }, []);

  const setPlanState = (e, idx) => {
    e.persist();

    let newPlans = [...plans];
    newPlans[idx] = { ...newPlans[idx], [e.target.name]: e.target.value };

    setPlans(newPlans);
  };

  const updateSettings = async (e) => {
    e.preventDefault();
    strapi.lockApp();

    try {
      const res = await request(`/${pluginId}/settings`, {
        method: "POST",
        body: {
          pk,
          plans,
          whs,
        },
      });

      strapi.notification.success("Successful updated Stripe Information");
    } catch (error) {
      strapi.notification.error(error.toString());
    }

    strapi.unlockApp();
  };
  return (
    <div className="row">
      <div className="col-md-12">
        <Styled.Container>
          <Styled.Block>
            <h1>{toTitleCase(pluginId)}</h1>
            <p>Save your Stripe information below</p>
            <form onSubmit={updateSettings}>
              <div>
                <label htmlFor="pk">Stripe Private Key</label>
                <InputText
                  name="pk"
                  type="password"
                  value={pk}
                  onChange={(e) => setPk(e.target.value)}
                  placeholder="Stripe Private Key"
                />
              </div>
              <div>
                <label htmlFor="whs">Stripe Webhook Secret</label>
                <InputText
                  name="whs"
                  type="password"
                  value={whs}
                  onChange={(e) => setWhs(e.target.value)}
                  placeholder="Stripe Webhook Secret"
                />
              </div>
              <div>
                {plans.map((plan, idx) => (
                  <>
                    <label htmlFor="id">Plan ID #{idx + 1}</label>
                    <InputText
                      type="text"
                      name="id"
                      value={plan.id}
                      onChange={(e) => setPlanState(e, idx)}
                      placeholder={`Stripe Plan ID # ${idx + 1}`}
                    />
                  </>
                ))}
              </div>

              <Padded top>
                <Button color="primary" label="Submit" type="submit" />
              </Padded>
            </form>
          </Styled.Block>
        </Styled.Container>
      </div>
    </div>
  );
};

export default memo(HomePage);
