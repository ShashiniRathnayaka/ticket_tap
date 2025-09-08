import 'package:flutter/material.dart';
import 'package:ticket_tap/views/driver%20screens/d_homeScreen.dart';

class DriverTripHistoryScreen extends StatelessWidget {
  final List<DriverTrip> pastTrips = [
    DriverTrip(
      id: '101',
      route: 'Route 42 - Downtown Express',
      busNumber: 'BUS-001',
      startTime: '08:00 AM',
      endTime: '09:30 AM',
      date: 'Oct 15, 2023',
      status: 'Completed',
    ),
    DriverTrip(
      id: '102',
      route: 'Route 18 - University Line',
      busNumber: 'BUS-015',
      startTime: '02:00 PM',
      endTime: '03:45 PM',
      date: 'Oct 14, 2023',
      status: 'Completed',
    ),
    DriverTrip(
      id: '103',
      route: 'Route 7 - Beachfront',
      busNumber: 'BUS-008',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      date: 'Oct 13, 2023',
      status: 'Completed',
    ),
    DriverTrip(
      id: '104',
      route: 'Route 25 - City Center',
      busNumber: 'BUS-012',
      startTime: '04:00 PM',
      endTime: '05:30 PM',
      date: 'Oct 12, 2023',
      status: 'Cancelled',
    ),
  ];

  DriverTripHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trip History'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Past Trips",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            const Text(
              "View your completed and cancelled trips",
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 20),
            
            Expanded(
              child: ListView.builder(
                itemCount: pastTrips.length,
                itemBuilder: (context, index) {
                  return _buildHistoryItem(pastTrips[index]);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryItem(DriverTrip trip) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
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
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Chip(
                  label: Text(
                    trip.status,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                  backgroundColor: _getStatusColor(trip.status),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('Bus: ${trip.busNumber}'),
            const SizedBox(height: 4),
            Text('Date: ${trip.date}'),
            const SizedBox(height: 4),
            Text('Time: ${trip.startTime} - ${trip.endTime}'),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}