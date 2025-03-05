import React, { useState, useEffect } from 'react';
import './About.css';
import Topbar from './Topbar';
import { HiArrowSmallLeft, HiArrowSmallRight } from "react-icons/hi2";
import bcorner from '../assets/bcorner.jpg';
import lcorner from '../assets/lcorner.png';
import tcorner from '../assets/tcorner.jpg';
import rcorner from '../assets/rcorner.jpg';
import TawkTo from './TawkTo';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const About = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    'ap12.jpg',
    'ap1.jpg',
    'ap3.jpg',
    'ap4.jpeg',
    'ap5.jpeg',
    'ap6.jpeg',
    'ap7.jpeg',
    'ap8.jpeg',
    'ap9.jpeg',
    'ap10.jpeg',
    'ap11.jpeg',
   
    'ap13.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    }, 5000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  const handleLeftClick = () => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const handleRightClick = () => {
    setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <div>
      <Topbar />
      <ToastContainer></ToastContainer>
      <div className="about">
        <div className="lcorner" style={{ backgroundImage: `url(${lcorner})` }}>
     
        </div>
        <div className="rcorner" style={{ backgroundImage: `url(${rcorner})` }}>

        </div>
        <div className="tcorner" style={{ backgroundImage: `url(${tcorner})` }}></div>
        <div className="bcorner" style={{ backgroundImage: `url(${bcorner})` }}></div>
        {/* <img src="leaf.jpg" alt="" /> */}
        <div className="abox1">
          <h1>Palmyra Fruit (Thati Munjalu)</h1>
          <p className='text1 atext'>
            also called <strong>ICE APPLE</strong> fruit in English, is known for its sweet and luscious taste.
            Ancient records suggest that the fruit was highly valued for its hydrating and nourishing qualities, making it a crucial source of food in hot climates...
          </p>
          <div className="text1 timg">
            Palmyra fruit is a symbol of prosperity and fertility. Farmers call the tree “The Tree of Life” because not just the fruit but every part of the Palmyra tree <span className="hide"> is useful—its leaves, wood, and sap are used for everything from making crafts to sweeteners like jaggery.</span>
          </div>
          <div className="aimg1">
            <img src="pr7.png" alt="" />
          </div>
          <p className='text1 atext atext2'>Throughout history, Palmyra fruit has been associated with numerous health benefits. It was often consumed to treat dehydration, digestive issues, and heat-related illnesses...</p>
         
        </div>
        <div className="img">
          <div className="image-slider">
            <img src={images[currentIndex]} alt="" className='aimg' />
          </div>
          <div className="abutton">
            <HiArrowSmallLeft id='aleft' onClick={handleLeftClick} />
            <HiArrowSmallRight id='aright' onClick={handleRightClick} />
          </div>
        </div>
        <p id='taste' className='atext'> <strong >About its taste</strong>  - Ice apple has a jelly-like texture. As you bite into it, a gush of sweet, watery juice explodes in your mouth. It tastes subtly sweet, subtly coconutty, and subtly bland. But overall, it's a good summery treat.</p> 
        <div className="aimg2">
          <img src="ap11.jpeg" alt="" />
        </div>
        <div className="aimg3">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/1fhK3u3JP78?si=VHghjtf24V58wXZx&mute=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

        </div>
        <div className="table">
          <h4>Nutrients</h4>
          <img src='table.png' alt='Nutrients Table' id='table'/>
        </div>
        <div className="benifits">
          <div><h1>Health Benefits of Ice Apples</h1><p id='bp'>
          (Obtained from the ice apple trees, the fruits offer several benefits to people of all ages and walks of life. Some of the many benefits of this exotic food include):
          </p>

<div className='text'>
<h3>Hydration:</h3><p> Ice apples are rich in water content, promoting hydration and preventing heat stroke. It can help regulate body temperature, making them particularly refreshing in hot weather and potentially preventing heat-related discomfort and illnesses.</p></div>
<div className="text">
<h3>Digestion:</h3><p> The fibre in ice apples supports digestive functioning. This is done by regulating regular bowel movements and alleviating digestive issues like constipation.</p></div>
<div className="text">
<h3>Rich in Nutrients: </h3><p>Ice apples are a valuable source of essential minerals and vitamins. It significantly fulfils major nutritional requirements and promotes overall bodily functions and vitality.</p></div>
<div className="text">
<h3>Heart Health:</h3><p> The higher potassium content and low sodium, contributes to heart health. This is done by maintaining adequate blood pressure levels and minimising risk of cardiovascular problems.
</p></div>
<div className="text">
<h3>Skin Health:</h3><p> The nutrients in ice apple benefits the skin significantly, providing essential vitamins and minerals that promote a radiant and healthy texture.</p></div>
<div className="text">
<h3>Removes Fatigue:</h3><p> Consuming ice apples can boost energy levels, making them an excellent choice for a quick, revitalising snack.</p></div>
<div className="text">
<h3>Good for People with Diabetes:</h3><p> Ice apples have a low glycemic index. This makes them a suitable choice for individuals with diabetes as they are less likely to cause rapid spikes in blood sugar levels.</p></div>
<div className="text">
<h3>Nausea Relief:</h3><p> They may help alleviate nausea and vomiting, relieving individuals experiencing digestive discomfort.
</p></div>
<div className="text">
<h3>Intestinal Health:</h3><p> Ice apples possess anthelmintic properties that can assist in addressing worm infestations and promoting intestinal health.</p></div>
<div className="text">
<h3>An Expectorant for Cough:</h3><p> Ice apples can potentially help to expel mucus during coughing and relieve respiratory symptoms.</p></div>
<div className="text">
<h3>Alleviates Urination Discomfort:</h3><p> The ice apple benefits in relieving painful urination and reducing enhancing overall well-being.</p></div>
<div className="text">

<h3>Combat Malnutrition:</h3><p> Ice apples can be a valuable resource for managing malnutrition in children and adults, providing essential nutrients to support overall health and growth.</p></div>

</div>
</div>
      </div>
    
    </div>
  );
}

export default About;
