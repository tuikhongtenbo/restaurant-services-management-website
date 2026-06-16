import Footer from "../../component/layouts/Footer/footer";
import Header from "../../component/layouts/Header/Header";
import About from "./about";
import Contact from "./contact";
import Hero from "./hero";
import Menu from "./menu";

function LandingPage() {
  return (
    <>
      <Header />
      <Hero />
      <About />
      <Menu />
      <Contact />
      <Footer />
    </>
  );
}
export default LandingPage;
