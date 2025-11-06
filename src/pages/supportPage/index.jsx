const SupportPage = () => (
  <main className="support-page">
    <section className="support-page__hero">
      <h1>Need a hand?</h1>
      <p>
        We are here to help with bookings, charging sessions, and account
        questions. Pick the option that fits best and our team will get back to
        you.
      </p>
    </section>

    <section className="support-page__grid">
      <article className="support-card">
        <h2>Contact Support</h2>
        <p className="support-card__description">
          Email us anytime at <a href="mailto:support@evcharging.vn">support@evcharging.vn</a>.
          We reply within one business day.
        </p>
        <ul className="support-card__list">
          <li>Account or profile updates</li>
          <li>Payment and billing questions</li>
          <li>Station availability feedback</li>
        </ul>
      </article>

      <article className="support-card">
        <h2>Emergency Help</h2>
        <p className="support-card__description">
          For urgent charging issues, call our hotline: <a href="tel:+84123456789">+84 123 456 789</a>.
        </p>
        <ul className="support-card__list">
          <li>Charger not working</li>
          <li>Session stuck or cannot stop</li>
          <li>Hardware or safety concerns</li>
        </ul>
      </article>

      <article className="support-card">
        <h2>Helpful Resources</h2>
        <p className="support-card__description">
          Visit the FAQ in your profile for quick answers on pricing, charging
          speed, and membership benefits.
        </p>
        <ul className="support-card__list">
          <li>View pricing plans</li>
          <li>Understand station types</li>
          <li>Manage vehicle preferences</li>
        </ul>
      </article>
    </section>
  </main>
);

export default SupportPage;
