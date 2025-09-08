import 'package:flutter/material.dart';
import 'package:ticket_tap/views/driver%20screens/d_homeScreen.dart';
import 'package:ticket_tap/views/driver%20screens/driver_qr_generator.dart';

class DriverTripDetailScreen extends StatefulWidget {
  final DriverTrip trip;

  const DriverTripDetailScreen({super.key, required this.trip});

  @override
  State<DriverTripDetailScreen> createState() => _DriverTripDetailScreenState();
}

class _DriverTripDetailScreenState extends State<DriverTripDetailScreen> {
  bool _tripStarted = false;
  String _currentStatus = 'Scheduled';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trip Details'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Trip Information
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.trip.route,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 15),
                    _buildDetailRow(Icons.directions_bus, 'Bus Number', widget.trip.busNumber),
                    _buildDetailRow(Icons.calendar_today, 'Date', widget.trip.date),
                    _buildDetailRow(Icons.access_time, 'Start Time', widget.trip.startTime),
                    _buildDetailRow(Icons.access_time, 'End Time', widget.trip.endTime),
                    _buildDetailRow(Icons.info, 'Status', _currentStatus),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Action Buttons
            if (!_tripStarted)
              Center(
                child: ElevatedButton(
                  onPressed: _startTrip,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                  ),
                  child: const Text('Start Trip', style: TextStyle(fontSize: 16)),
                ),
              ),
            
            if (_tripStarted) ...[
              Center(
                child: Column(
                  children: [
                    const Text(
                      'Trip in Progress',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green),
                    ),
                    const SizedBox(height: 10),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => DriverQrGeneratorScreen(trip: widget.trip),
                          ),
                        );
                      },
                      child: const Text('Generate QR Code for Passengers'),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _endTrip,
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                      child: const Text('End Trip', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 10),
          Text('$label: ', style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(value),
        ],
      ),
    );
  }

  void _startTrip() {
    setState(() {
      _tripStarted = true;
      _currentStatus = 'In Progress';
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Trip started successfully!')),
    );
  }

  void _endTrip() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('End Trip'),
          content: const Text('Are you sure you want to end this trip?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                setState(() {
                  _tripStarted = false;
                  _currentStatus = 'Completed';
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Trip ended successfully!')),
                );
              },
              child: const Text('End Trip', style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }
}