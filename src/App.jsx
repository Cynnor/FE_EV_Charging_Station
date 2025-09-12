import Header from "./components/header";
import HomePage from "./pages/homePage";
import Footer from "./components/footer";

function App() {
  return (
    <div className="app">
      <Header />
      <HomePage />
      <Footer /> {/* Footer luôn nằm dưới cùng */}
    </div>
  );
}

export default App;
