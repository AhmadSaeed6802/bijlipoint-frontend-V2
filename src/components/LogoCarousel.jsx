import React from 'react';

export default function LogoCarousel() {
  const logos = [
    'Lahore_University_of_Management_Sciences_Logo.svg',
    'Engro_Corporation_logo_(2025).svg',
    'Lucky_Cement_logo.png',
    'Nishat_Group.png',
    'Brighto_Paints_Logo.png',
    'NetSol_logo.svg',
    'Pakistan_International_Airlines_logo_(2004).svg',
    'Pakistan_Telecommunication_Company_Ltd.png',
    'University_of_the_Punjab_logo.png'
  ];

  return (
    <section className="logo-carousel">
      <div className="section-header-small">
        <h3>Trusted by Leading Organizations</h3>
      </div>
      <div className="carousel-container">
        <div className="carousel-track">
          {[...logos, ...logos].map((logo, i) => (
            <div key={i} className="logo-slide">
              <img 
                src={`${import.meta.env.BASE_URL}/logos/${logo}`} 
                alt="Partner Logo"
                className="logo-colored"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
