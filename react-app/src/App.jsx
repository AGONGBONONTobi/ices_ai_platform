import { Routes, Route } from "react-router-dom";
import IconSprite from "./components/IconSprite";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import MentionsLegales from "./pages/MentionsLegales";
import Confidentialite from "./pages/Confidentialite";

function App() {
  return (
    <>
      <IconSprite />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/confidentialite" element={<Confidentialite />} />
      </Routes>
    </>
  );
}

export default App;
