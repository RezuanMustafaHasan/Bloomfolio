import React from 'react';
import Hero from './Hero';
import Education from './Education';
import Pricing from './Pricing';
import Stats from './Stats';
import Awards from './Awards';
import OpenAccount from '../OpenAccount';
import Navbar from '../Navbar';
import Footer from '../Footer';
function HomePage() {
    return ( 
        <div>
            <Navbar />
            <Hero />
            <Awards /> 
            <Stats />
            <Education />
            <Pricing />
            <OpenAccount />
            <Footer />
        </div>
    );
}

export default HomePage;