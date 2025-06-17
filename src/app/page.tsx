"use client";

import { Button, Card, CardBody, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const features = [
    {
      icon: "🌍",
      title: "Environmental Monitoring",
      description: "Track CO2 emissions, air quality (PM2.5, PM10), and temperature data with real-time visualization and analysis.",
      gradient: "from-green-500 to-blue-600"
    },
    {
      icon: "🗺️",
      title: "Interactive GIS Mapping",
      description: "Advanced mapping capabilities with custom markers, layer management, and comprehensive spatial data visualization.",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: "✏️",
      title: "Drawing & Design Tools",
      description: "Create polygons, circles, polylines, and markers. Design custom shapes for analysis zones and monitoring areas.",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: "🔬",
      title: "Spatial Analysis",
      description: "Perform buffer analysis, intersection calculations, distance measurements, and advanced spatial operations.",
      gradient: "from-pink-500 to-red-600"
    },
    {
      icon: "🔍",
      title: "Smart Search & Filtering",
      description: "Advanced filtering by layer types, date ranges, spatial queries, and custom attribute ranges with saved presets.",
      gradient: "from-red-500 to-orange-600"
    },
    {
      icon: "💾",
      title: "Data Management",
      description: "Import/export GeoJSON data, save and load custom shapes, comprehensive data backup and restoration tools.",
      gradient: "from-orange-500 to-yellow-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-950 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-900 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-60 h-60 bg-slate-800 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse" style={{ animationDelay: '6s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
                 {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="text-6xl animate-bounce">🌍</div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-300 via-blue-200 to-purple-300 bg-clip-text text-transparent animate-pulse">
              EcoGIS
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Advanced Environmental Monitoring & GIS Analysis Platform
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Chip color="primary" variant="flat" className="animate-fade-in bg-slate-900/50 text-slate-300 border-slate-700">Real-time Monitoring</Chip>
            <Chip color="secondary" variant="flat" className="animate-fade-in bg-slate-900/50 text-slate-300 border-slate-700" style={{ animationDelay: '0.2s' }}>Spatial Analysis</Chip>
            <Chip color="success" variant="flat" className="animate-fade-in bg-slate-900/50 text-slate-300 border-slate-700" style={{ animationDelay: '0.4s' }}>Data Visualization</Chip>
            <Chip color="warning" variant="flat" className="animate-fade-in bg-slate-900/50 text-slate-300 border-slate-700" style={{ animationDelay: '0.6s' }}>GeoJSON Support</Chip>
          </div>
        </header>

        {/* Action Buttons */}
        <div className="text-center mb-20">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {session ? (
              <Button
                size="lg"
                color="primary"
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                onPress={() => router.push('/dashboard')}
              >
                🚀 Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  color="primary"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                  onPress={() => router.push('/login')}
                >
                  🚀 Get Started
                </Button>
                <Button
                  size="lg"
                  variant="bordered"
                  className="text-lg px-8 py-6 border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white transform hover:scale-105 transition-all duration-300"
                  onPress={() => router.push('/register')}
                >
                  📝 Sign Up
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 hover:border-gray-500 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
                style={{
                  animation: `fadeInUp 0.8s ease-out ${index * 0.1}s both`
                }}
              >
                <CardBody className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4 animate-bounce" style={{ animationDelay: `${index * 0.2}s` }}>
                      {feature.icon}
                    </div>
                    <h3 className={`text-xl font-bold mb-3 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        

        {/* Technology Stack */}
        <section className="text-center">
          <h3 className="text-2xl font-bold mb-6 text-gray-300">Built with Modern Technology</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Chip color="primary" size="lg" className="text-blue-400 bg-blue-900/30">Next.js 14</Chip>
            <Chip color="secondary" size="lg" className="text-purple-400 bg-purple-900/30">TypeScript</Chip>
            <Chip color="success" size="lg" className="text-green-400 bg-green-900/30">Leaflet</Chip>
            <Chip color="warning" size="lg" className="text-orange-400 bg-orange-900/30">Turf.js</Chip>
            <Chip color="danger" size="lg" className="text-red-400 bg-red-900/30">HeroUI</Chip>
            <Chip color="default" size="lg" className="text-gray-400 bg-gray-800/30">PostGIS</Chip>
          </div>
        </section>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out both;
        }
      `}</style>
    </div>
  );
}
