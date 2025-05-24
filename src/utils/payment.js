import Stripe from "stripe";
const payment = async ({
  stripe = new Stripe(process.env.STRIPE_KEY),
  payment_method_types = ["card"],
  customer_email,
  mode="payment",
  cancel_url,
  success_url,
  metadata={},
  discounts = [],
  line_items = [],
}) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types,
    customer_email,
    cancel_url,
    success_url,
    mode,
    metadata,
    discounts,
    line_items,
  });
  return session;
};
export default payment;
