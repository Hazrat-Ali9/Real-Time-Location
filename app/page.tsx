
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Wifi } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const Main = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Real-Time Location & User Feed</h1>
          <p className="text-lg text-gray-600">Demonstrate SignalR integration and infinite scroll patterns</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Location Sharing
              </CardTitle>
              <CardDescription>Real-time GPS coordinate sharing between users using SignalR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link
                  href="/location/sender"
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  User A - Send Location
                </Link>
                <Link
                  href="/location/receiver"
                  className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  User B - Receive Location
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                User Feed
              </CardTitle>
              <CardDescription>Infinite scroll user list with virtualization and error handling</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/users"
                className="block w-full bg-purple-600 text-white text-center py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
              >
                View User Feed
              </Link>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
};

export default Main;
