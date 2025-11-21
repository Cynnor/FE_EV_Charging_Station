import { useState, useEffect } from "react";
import api from "./src/config/api";

const TestStationFetch = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const response = await api.get("/stations");
        
        let stationsData = [];
        if (response.data.items && Array.isArray(response.data.items)) {
            stationsData = response.data.items;
        } else if (Array.isArray(response.data.data)) {
            stationsData = response.data.data;
        } else if (Array.isArray(response.data)) {
            stationsData = response.data;
        }
        
        setStations(stationsData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Stations</h1>
      <ul>
        {stations.map((station) => (
          <li key={station.id}>{station.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default TestStationFetch;