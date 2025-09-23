import 'package:flutter/material.dart';
import 'package:ticket_tap/services/secure_storage_services.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class DriverTripHistoryScreen extends StatefulWidget {
  const DriverTripHistoryScreen({super.key});

  @override
  State<DriverTripHistoryScreen> createState() => _DriverTripHistoryScreenState();
}

class _DriverTripHistoryScreenState extends State<DriverTripHistoryScreen> {
  List<DriverTrip> pastTrips = [];
  bool isLoading = true;
  String errorMessage = '';
  String driverName = '';

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _fetchTripHistory();
  }

  Future<void> _loadUserData() async {
    try {
      final userData = await SecureStorageService.getUserData();
      if (userData != null) {
        setState(() {
          driverName = userData['name'] ?? 'Driver';
        });
      }
    } catch (e) {
      print('Error loading user data: $e');
    }
  }

  Future<http.Response> _makeAuthenticatedRequest(Function request) async {
    try {
      final userData = await SecureStorageService.getUserData();
      if (userData == null) {
        throw Exception('User not logged in');
      }

      String token = userData['authToken'] ?? '';
      return await request(token);
    } catch (e) {
      throw Exception('Authentication failed: $e');
    }
  }

  Future<void> _fetchTripHistory() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = '';
      });

      final userData = await SecureStorageService.getUserData();

      final response = await _makeAuthenticatedRequest((String token) {
        return http.get(
          Uri.parse('http://192.168.8.117:5000/drivers/history/${userData['userId']}'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        );
      });

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          setState(() {
            pastTrips = (data['trips'] as List).map((tripData) {
              return DriverTrip.fromApi(tripData);
            }).toList();
            isLoading = false;
          });
        } else {
          setState(() {
            errorMessage = data['message'] ?? 'Failed to load trip history';
            isLoading = false;
          });
        }
      } else {
        setState(() {
          errorMessage = 'Failed to load trip history: ${response.statusCode}';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error: ${e.toString().replaceAll('Exception: ', '')}';
        isLoading = false;
      });
    }
  }

  Future<void> _refreshData() async {
    await _fetchTripHistory();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text(
          'Trip History',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: const Color(0xFF4E1A93),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Welcome back, $driverName!",
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF4E1A93),
              ),
            ),
            const SizedBox(height: 5),
            const Text(
              "Your trip history is listed below",
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 20),
            
            if (isLoading)
              const Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4E1A93)),
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Loading trip history...',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              )
            else if (errorMessage.isNotEmpty)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        errorMessage,
                        style: const TextStyle(color: Colors.grey),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _refreshData,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4E1A93),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Try Again'),
                      ),
                    ],
                  ),
                ),
              )
            else if (pastTrips.isEmpty)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.history_outlined,
                        size: 64,
                        color: Colors.grey,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'No trip history found',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Your completed trips will appear here',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _refreshData,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4E1A93),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Refresh'),
                      ),
                    ],
                  ),
                ),
              )
            else
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _refreshData,
                  backgroundColor: const Color(0xFF4E1A93),
                  color: Colors.white,
                  child: ListView.builder(
                    itemCount: pastTrips.length,
                    itemBuilder: (context, index) {
                      return _buildHistoryItem(pastTrips[index]);
                    },
                  ),
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
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF4E1A93).withOpacity(0.1)),
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
                      trip.route,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF4E1A93),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(trip.status),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      trip.status.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              
              // Trip Details
              _buildDetailRow(Icons.directions_bus, 'Bus', trip.busNumber),
              _buildDetailRow(Icons.calendar_today, 'Date', trip.date),
              _buildDetailRow(Icons.access_time, 'Time', '${trip.startTime} - ${trip.endTime}'),
              
              if (trip.actualStartTime != null && trip.actualStartTime!.isNotEmpty)
                _buildDetailRow(Icons.play_arrow, 'Started', trip.actualStartTime!),
              
              if (trip.actualEndTime != null && trip.actualEndTime!.isNotEmpty)
                _buildDetailRow(Icons.stop, 'Ended', trip.actualEndTime!),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        children: [
          Icon(icon, size: 14, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.green;
      case 'in_progress':
        return const Color(0xFF4E1A93);
      case 'cancelled':
        return Colors.red;
      case 'scheduled':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}

// Update the DriverTrip model to include actual times
class DriverTrip {
  final String id;
  final String route;
  final String busNumber;
  final String startTime;
  final String endTime;
  final String date;
  final String status;
  final String startLocation;
  final String endLocation;
  final String distance;
  final String busType;
  final String licensePlate;
  final String? actualStartTime;
  final String? actualEndTime;

  DriverTrip({
    required this.id,
    required this.route,
    required this.busNumber,
    required this.startTime,
    required this.endTime,
    required this.date,
    required this.status,
    required this.startLocation,
    required this.endLocation,
    required this.distance,
    required this.busType,
    required this.licensePlate,
    this.actualStartTime,
    this.actualEndTime,
  });

  factory DriverTrip.fromApi(Map<String, dynamic> apiData) {
    // Format time to 12-hour format
    String formatTime(String? timeString) {
      if (timeString == null) return '';
      try {
        final parts = timeString.split(':');
        final hour = int.parse(parts[0]);
        final minute = int.parse(parts[1]);
        
        final period = hour >= 12 ? 'PM' : 'AM';
        final displayHour = hour % 12 == 0 ? 12 : hour % 12;
        
        return '$displayHour:${minute.toString().padLeft(2, '0')} $period';
      } catch (e) {
        return timeString;
      }
    }

    // Format date
    String formatDate(String? dateString) {
      if (dateString == null) return 'Unknown Date';
      try {
        final date = DateTime.parse(dateString);
        return '${_getMonthName(date.month)} ${date.day}, ${date.year}';
      } catch (e) {
        return dateString;
      }
    }

    return DriverTrip(
      id: apiData['id'].toString(),
      route: '${apiData['start_location'] ?? 'Unknown'} to ${apiData['end_location'] ?? 'Unknown'}',
      busNumber: apiData['bus_number'] ?? 'Unknown',
      startTime: formatTime(apiData['scheduled_departure'] ?? apiData['departure_time']),
      endTime: formatTime(apiData['scheduled_arrival'] ?? apiData['arrival_time']),
      date: formatDate(apiData['trip_date']),
      status: (apiData['status'] ?? 'COMPLETED').toString().replaceAll('_', ' ').toLowerCase().split(' ').map((word) => word[0].toUpperCase() + word.substring(1)).join(' '),
      startLocation: apiData['start_location'] ?? 'Unknown',
      endLocation: apiData['end_location'] ?? 'Unknown',
      distance: '0', // You might want to get this from your API
      busType: apiData['bus_type'] ?? 'Unknown',
      licensePlate: 'Unknown', // You might want to get this from your API
      actualStartTime: formatTime(apiData['actual_start_time']),
      actualEndTime: formatTime(apiData['actual_end_time']),
    );
  }

  static String _getMonthName(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }
}