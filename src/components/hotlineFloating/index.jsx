import "./index.scss";

const hotlines = [{ phone: "0335165044", href: "tel:0335165044" }];

const HotlineFloating = () => (
  <div className="hotline-floating">
    {hotlines.map((item) => (
      <a
        key={item.phone}
        href={item.href}
        className="hotline-floating__item"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="hotline-floating__icon">📞</span>
        <span className="hotline-floating__text">{item.phone}</span>
      </a>
    ))}
  </div>
);

export default HotlineFloating;
