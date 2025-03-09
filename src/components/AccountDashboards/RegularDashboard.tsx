const Sidebar = () => (
  <div className="w-64 bg-white h-screen shadow-md">
    <div className="p-6">
      <h1 className="text-xl font-bold">Material Tailwind React</h1>
    </div>
    <nav className="mt-6">
      {[
        { icon: "fas fa-home", label: "Dashboard" },
        { icon: "fas fa-user", label: "Profile" },
        { icon: "fas fa-table", label: "Tables" },
        { icon: "fas fa-bell", label: "Notifications" },
      ].map((item, index) => (
        <a
          key={index}
          className="flex items-center p-4 text-gray-600 hover:bg-gray-200 rounded-lg"
          href="#"
        >
          <i className={`${item.icon} mr-3`}></i>
          <span>{item.label}</span>
        </a>
      ))}

      <div className="mt-6">
        <h2 className="text-gray-600 px-4">AUTH PAGES</h2>
        {[
          { icon: "fas fa-sign-in-alt", label: "Sign In" },
          { icon: "fas fa-user-plus", label: "Sign Up" },
        ].map((item, index) => (
          <a
            key={index}
            className="flex items-center p-4 text-gray-600 hover:bg-gray-200 rounded-lg"
            href="#"
          >
            <i className={`${item.icon} mr-3`}></i>
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  </div>
);

const Header = () => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h2 className="text-gray-600">Dashboard / Home</h2>
      <h1 className="text-2xl font-bold">Home</h1>
    </div>
    <div className="flex items-center space-x-4">
      <div className="relative">
        <input
          className="bg-white h-10 px-5 pr-10 rounded-full text-sm focus:outline-none"
          placeholder="Search"
          type="text"
        />
        <button className="absolute right-0 top-0 mt-3 mr-4">
          <i className="fas fa-search"></i>
        </button>
      </div>
      <i className="fas fa-user text-gray-600"></i>
      <span className="text-gray-600">Sign In</span>
      <i className="fas fa-bell text-gray-600"></i>
      <i className="fas fa-cog text-gray-600"></i>
    </div>
  </div>
);

const StatCard = ({
  icon,
  title,
  value,
  change,
  isPositive,
}: {
  icon: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center mb-4">
      <div className="bg-black p-3 rounded-full text-white">
        <i className={icon}></i>
      </div>
      <div className="ml-4">
        <p className="text-gray-600">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
    <p className={isPositive ? "text-green-500" : "text-red-500"}>{change}</p>
  </div>
);

const RegularDashboard = () => (
  <div className="flex">
    <Sidebar />
    <div className="flex-1 p-6">
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon="fas fa-wallet"
          title="Today's Money"
          value="$53k"
          change="+55% than last week"
          isPositive={true}
        />
        <StatCard
          icon="fas fa-users"
          title="Today's Users"
          value="2,300"
          change="+3% than last month"
          isPositive={true}
        />
        <StatCard
          icon="fas fa-user-plus"
          title="New Clients"
          value="3,462"
          change="-2% than yesterday"
          isPositive={false}
        />
        <StatCard
          icon="fas fa-chart-line"
          title="Sales"
          value="$103,430"
          change="+5% than yesterday"
          isPositive={true}
        />
      </div>
    </div>
  </div>
);

export default RegularDashboard;
