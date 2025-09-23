import 'package:flutter/material.dart';
import 'package:ticket_tap/services/secure_storage_services.dart';
import 'package:ticket_tap/views/driver%20screens/d_homeScreen.dart';
import 'package:ticket_tap/views/driver%20screens/driver_qr_generator.dart';
import 'package:http/http.dart' as http;

class DriverTripDetailScreen extends StatefulWidget {
  final DriverTrip trip;
  final String authToken;

  const DriverTripDetailScreen({super.key, required this.trip, required this.authToken});

  @override
  State<DriverTripDetailScreen> createState() => _DriverTripDetailScreenState();
}

class _DriverTripDetailScreenState extends State<DriverTripDetailScreen> {
  bool _tripStarted = false;
  bool _tripCompleted = false;
  String _currentStatus = 'Scheduled';
  String _startTime = '';
  String _endTime = '';

  @override
  void initState() {
    super.initState();
    _checkTripStatus();
  }

  void _checkTripStatus() {
    // You can check from your database if the trip was already started/completed
    // For now, we'll use local state only
  }

  Future<void> _startTripInDatabase() async {
    try {
      final userData = await SecureStorageService.getUserData();
      if (userData == null) return;

      final token = userData['authToken'];
      final response = await http.post(
        Uri.parse('http://192.168.8.117:5000/drivers/start/${userData['userId']}/${widget.trip.id}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        // body: json.encode({
        //   'schedule_id': widget.trip.id,
        //   'start_time': DateTime.now().toIso8601String(),
        // }),
      );

      if (response.statusCode == 200) {
        print('Trip started successfully in database');
      } else {
        print('Failed to start trip in database: ${response.statusCode}');
      }
    } catch (e) {
      print('Error starting trip in database: $e');
    }
  }

  Future<void> _endTripInDatabase() async {
    try {
      final userData = await SecureStorageService.getUserData();
      if (userData == null) return;

      final token = userData['authToken'];
      final response = await http.post(
        Uri.parse('http://192.168.8.117:5000/drivers/end/${userData['userId']}/${widget.trip.id}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.authToken}',
        },
        // body: json.encode({
        //   'schedule_id': widget.trip.id,
        //   'end_time': DateTime.now().toIso8601String(),
        // }),
      );

      if (response.statusCode == 200) {
        print('Trip ended successfully in database');
      } else {
        print('Failed to end trip in database: ${response.statusCode}');
      }
    } catch (e) {
      print('Error ending trip in database: $e');
    }
  }

  String _getCurrentTime() {
    final now = DateTime.now();
    final hour = now.hour % 12 == 0 ? 12 : now.hour % 12;
    final minute = now.minute.toString().padLeft(2, '0');
    final period = now.hour < 12 ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'Trip Details',
            style: TextStyle(color: Colors.white),
          ),
          backgroundColor: const Color(0xFF4E1A93),
          elevation: 0,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Trip Overview Card
                Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF4E1A93).withOpacity(0.2)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  widget.trip.route,
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF4E1A93),
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: _getStatusColor(_currentStatus),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  _currentStatus.toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          
                          // Route Details
                          _buildDetailSection(
                            'Route Information',
                            Icons.route,
                            [
                              _buildDetailItem('Start Location', widget.trip.startLocation),
                              _buildDetailItem('End Location', widget.trip.endLocation),
                              _buildDetailItem('Distance', '${widget.trip.distance} km'),
                            ],
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Bus Details
                          _buildDetailSection(
                            'Bus Information',
                            Icons.directions_bus,
                            [
                              _buildDetailItem('Bus Number', widget.trip.busNumber),
                              _buildDetailItem('Bus Type', widget.trip.busType),
                              _buildDetailItem('License Plate', widget.trip.licensePlate),
                            ],
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Schedule Details
                          _buildDetailSection(
                            'Schedule Information',
                            Icons.schedule,
                            [
                              _buildDetailItem('Date', widget.trip.date),
                              _buildDetailItem('Departure Time', widget.trip.startTime),
                              _buildDetailItem('Arrival Time', widget.trip.endTime),
                              if (_startTime.isNotEmpty)
                                _buildDetailItem('Actual Start Time', _startTime),
                              if (_endTime.isNotEmpty)
                                _buildDetailItem('Actual End Time', _endTime),
                            ],
                          ),
                          
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Action Buttons - Show different states based on trip status
                if (!_tripStarted && !_tripCompleted)
                  _buildStartTripButton(),
                
                if (_tripStarted && !_tripCompleted)
                  _buildInProgressButtons(),
                
                if (_tripCompleted)
                  _buildCompletedState(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStartTripButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _startTrip,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF4E1A93),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.play_arrow, size: 20),
            SizedBox(width: 8),
            Text(
              'Start Trip',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInProgressButtons() {
    return Column(
      children: [
        // Status Indicator with current time
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.green),
          ),
          child: Row(
            children: [
              Icon(Icons.directions_bus, color: Colors.green.shade600),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Trip in Progress',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.green.shade600,
                      ),
                    ),
                    Text(
                      'Started at $_startTime',
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 20),
        
        // QR Code Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => DriverQrGeneratorScreen(trip: widget.trip),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue.shade700,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.qr_code, size: 20),
                SizedBox(width: 8),
                Text(
                  'Generate QR Code for Tickets',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
        
        const SizedBox(height: 12),
        
        // End Trip Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _endTrip,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.stop, size: 20),
                SizedBox(width: 8),
                Text(
                  'End Trip',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCompletedState() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey),
      ),
      child: Row(
        children: [
          Icon(Icons.check_circle, color: Colors.grey.shade600),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Trip Completed',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade600,
                  ),
                ),
                Text(
                  'Started at $_startTime • Ended at $_endTime',
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 8),
                Text(
                  'This trip has been completed. No further actions available.',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailSection(String title, IconData icon, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 18, color: const Color(0xFF4E1A93)),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF4E1A93),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...items,
      ],
    );
  }

  Widget _buildDetailItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return const Color(0xFF4E1A93);
      case 'in progress':
        return Colors.green;
      case 'completed':
        return Colors.grey;
      case 'cancelled':
        return Colors.red;
      default:
        return const Color(0xFF4E1A93);
    }
  }

  void _startTrip() {
    final currentTime = _getCurrentTime();
    setState(() {
      _tripStarted = true;
      _tripCompleted = false;
      _currentStatus = 'In Progress';
      _startTime = currentTime;
      _endTime = '';
    });
    
    // Save to database for tracking and QR code validation
    _startTripInDatabase();
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Trip started at $currentTime'),
        backgroundColor: Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  void _endTrip() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text(
            'End Trip',
            style: TextStyle(color: Color(0xFF4E1A93)),
          ),
          content: const Text('Are you sure you want to end this trip? Passengers will no longer be able to buy tickets.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final endTime = _getCurrentTime();
                Navigator.of(context).pop();
                setState(() {
                  _tripStarted = false;
                  _tripCompleted = true;
                  _currentStatus = 'Completed';
                  _endTime = endTime;
                });
                
                // Save to database
                _endTripInDatabase();
                
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Trip ended at $endTime'),
                    backgroundColor: Colors.green.shade600,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('End Trip', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }
}