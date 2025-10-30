import { useState, useEffect } from 'react';
import './ChargingStationCarousel.scss';

const ChargingStationCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sample images - replace with your actual charging station images
  const advertisements = [
    {
      id: 1,
      image: './assets/AC4.jpg',
      title: 'Trụ sạc AC - Tiết kiệm',
      description: 'Sạc chậm an toàn cho xe.'
    },
    {
      id: 2,
      image: './assets/DC60.jpg',
      title: 'Trụ sạc DC - Nhanh chóng',
      description: 'Sạc nhanh trong 30-60 phút'
    },
    {
      id: 3,
      image: './assets/DC250.jpg',
      title: 'Trụ sạc DC Ultra - Siêu tốc',
      description: 'Công nghệ sạc nhanh mới.'
    },
    {
      id: 4,
      image: './assets/banner.jpg',
      title: 'Mạng lưới sạc toàn quốc',
      description: 'Hơn 1000+ điểm sạc.'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        (prevIndex + 1) % advertisements.length
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [advertisements.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? advertisements.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % advertisements.length
    );
  };

  return (
    <div className="charging-station-carousel">
      <div className="carousel-container">
        <button className="carousel-btn prev-btn" onClick={goToPrevious}>
          ‹
        </button>
        
        <div className="carousel-content">
          <div 
            className="carousel-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {advertisements.map((ad) => (
              <div key={ad.id} className="carousel-slide">
                <img src={ad.image} alt={ad.title} />
                <div className="carousel-overlay">
                  <h3>{ad.title}</h3>
                  <p>{ad.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="carousel-btn next-btn" onClick={goToNext}>
          ›
        </button>
      </div>

      <div className="carousel-indicators">
        {advertisements.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ChargingStationCarousel;
