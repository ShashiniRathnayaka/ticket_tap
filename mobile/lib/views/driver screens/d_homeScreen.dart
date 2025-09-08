import 'package:flutter/material.dart';
import 'package:ticket_tap/themes/gradient_background.dart';
import 'package:ticket_tap/views/driver%20screens/driver_trip_detail.dart';
import 'package:ticket_tap/views/driver%20screens/driver_trip_history.dart';
import 'package:ticket_tap/views/passenger%20screens/profile_screen.dart';

class DHomescreen extends StatefulWidget {
  const DHomescreen({super.key});

  @override
  State<DHomescreen> createState() => _DHomescreenState();
}

class _DHomescreenState extends State<DHomescreen> {
  int _selectedIndex = 0;
  
  // Screens for bottom navigation
  final List<Widget> _screens = [
    DriverDashboard(),
    DriverTripHistoryScreen(),
    ProfileScreen()
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return GradientScaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.directions_bus),
            label: 'My Trips',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'History',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.blue[700],
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        onTap: _onItemTapped,
      ),
    );
  }
}

// Driver Dashboard Screen
class DriverDashboard extends StatelessWidget {
  final List<DriverTrip> upcomingTrips = [
    DriverTrip(
      id: '1',
      route: 'Route 42 - Downtown Express',
      busNumber: 'BUS-001',
      startTime: '08:00 AM',
      endTime: '09:30 AM',
      date: 'Today',
      status: 'Scheduled',
    ),
    DriverTrip(
      id: '2',
      route: 'Route 18 - University Line',
      busNumber: 'BUS-015',
      startTime: '02:00 PM',
      endTime: '03:45 PM',
      date: 'Today',
      status: 'Scheduled',
    ),
    DriverTrip(
      id: '3',
      route: 'Route 7 - Beachfront',
      busNumber: 'BUS-008',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      date: 'Tomorrow',
      status: 'Scheduled',
    ),
  ];

  DriverDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Assigned Trips'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Welcome Driver!",
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 5),
            const Text(
              "Your assigned trips are listed below",
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 20),
            
            Expanded(
              child: ListView.builder(
                itemCount: upcomingTrips.length,
                itemBuilder: (context, index) {
                  return TripCard(trip: upcomingTrips[index]);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Trip Data Model
class DriverTrip {
  final String id;
  final String route;
  final String busNumber;
  final String startTime;
  final String endTime;
  final String date;
  final String status;

  DriverTrip({
    required this.id,
    required this.route,
    required this.busNumber,
    required this.startTime,
    required this.endTime,
    required this.date,
    required this.status,
  });
}

// Trip Card Widget
class TripCard extends StatelessWidget {
  final DriverTrip trip;

  const TripCard({super.key, required this.trip});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  trip.route,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Chip(
                  label: Text(
                    trip.status,
                    style: const TextStyle(color: Colors.white),
                  ),
                  backgroundColor: _getStatusColor(trip.status),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.directions_bus, size: 20, color: Colors.grey),
                const SizedBox(width: 5),
                Text('Bus: ${trip.busNumber}'),
              ],
            ),
            const SizedBox(height: 5),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 20, color: Colors.grey),
                const SizedBox(width: 5),
                Text('Date: ${trip.date}'),
              ],
            ),
            const SizedBox(height: 5),
            Row(
              children: [
                const Icon(Icons.access_time, size: 20, color: Colors.grey),
                const SizedBox(width: 5),
                Text('Time: ${trip.startTime} - ${trip.endTime}'),
              ],
            ),
            const SizedBox(height: 15),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => DriverTripDetailScreen(trip: trip),
                  ),
                );
              },
              child: const Text('View Trip Details'),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return Colors.blue;
      case 'in progress':
        return Colors.green;
      case 'completed':
        return Colors.grey;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}