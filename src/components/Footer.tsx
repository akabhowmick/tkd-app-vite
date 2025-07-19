import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const footerData = {
  companyName: "Taekwondo Student Management App",
  contacts: {
    phone: "+1 234 567 890",
    email: "info@taekwondoapp.com",
    address: "123 Martial Arts Lane, City, Country",
  },
  socialMedia: [
    { name: "Facebook", icon: FaFacebook, link: "https://facebook.com" },
    { name: "Twitter", icon: FaTwitter, link: "https://twitter.com" },
    { name: "Instagram", icon: FaInstagram, link: "https://instagram.com" },
    { name: "LinkedIn", icon: FaLinkedin, link: "https://linkedin.com" },
  ],
  services: [
    { name: "Class Schedules", link: "/schedules" },
    { name: "Private Lessons", link: "/private-lessons" },
    { name: "Event Registration", link: "/events" },
    { name: "Rank Testing Info", link: "/rank-testing" },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-red-900 text-white py-8">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 w-11/12">

        {/* Company Name */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">{footerData.companyName}</h1>
        </div>

        {/* Contacts */}
        <div>
          <h3 className="text-xl font-bold mb-4">Contacts</h3>
          <p>Phone: {footerData.contacts.phone}</p>
          <p>Email: {footerData.contacts.email}</p>
          <p>Address: {footerData.contacts.address}</p>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-xl font-bold mb-4">Follow Us</h3>
          <div className="flex space-x-4">
            {footerData.socialMedia.map((media) => (
              <a
                key={media.name}
                href={media.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-2xl hover:text-gray-300"
                aria-label={media.name}
              >
                <media.icon />
              </a>
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-xl font-bold mb-4">Services</h3>
          <ul>
            {footerData.services.map((service) => (
              <li key={service.name}>
                <a href={service.link} className="hover:underline">
                  {service.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </footer>
  );
};
