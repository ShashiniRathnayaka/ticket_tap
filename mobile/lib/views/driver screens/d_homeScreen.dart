import 'package:flutter/material.dart';
import 'package:ticket_tap/services/secure_storage_services.dart';
import 'package:ticket_tap/themes/gradient_background.dart';
import 'package:ticket_tap/views/driver%20screens/driver_trip_detail.dart';
import 'package:ticket_tap/views/driver%20screens/driver_trip_history.dart';
import 'package:ticket_tap/views/passenger%20screens/profile_screen.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:ticket_tap/views/sign_in.dart';

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
        selectedItemColor: const Color(0xFF4E1A93),
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        onTap: _onItemTapped,
      ),
    );
  }
}

// Driver Dashboard Screen
class DriverDashboard extends StatefulWidget {
  @override
  _DriverDashboardState createState() => _DriverDashboardState();
}

class _DriverDashboardState extends State<DriverDashboard> {
  List<DriverTrip> upcomingTrips = [];
  bool isLoading = true;
  String errorMessage = '';
  String driverName = '';
  String accessToken = '';

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _fetchDriverSchedules();
  }

  Future<void> _loadUserData() async {
    try {
      final userData = await SecureStorageService.getUserData();
      if (userData != null) {
        setState(() {
          driverName = userData['name'] ?? 'Driver';
          accessToken = userData['authToken'] ?? '';
        });
      }
    } catch (e) {
      print('Error loading user data: $e');
    }
  }

  Future<String?> _refreshToken() async {
    try {
      final userData = await SecureStorageService.getUserData();
      if (userData == null) return null;

      final refreshToken = userData['refreshToken'];
      if (refreshToken == null || refreshToken.isEmpty) return null;

      final response = await http.post(
        Uri.parse('http://192.168.8.117:5000/auth/refresh'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'refreshToken': refreshToken,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final newToken = data['token'];
        final newRefreshToken = data['refreshToken'];

        // Save new tokens
        await SecureStorageService.saveUserData(
          userId: userData['userId'] ?? '',
          email: userData['email'] ?? '',
          name: userData['name'] ?? '',
          role: userData['role'] ?? '',
          authToken: newToken,
          refreshToken: newRefreshToken,
        );

        return newToken;
      }
    } catch (e) {
      print('Error refreshing token: $e');
    }
    return null;
  }

  Future<http.Response> _makeAuthenticatedRequest(Function request) async {
    try {
      // Get current token
      final userData = await SecureStorageService.getUserData();
      if (userData == null) {
        throw Exception('User not logged in');
      }

      String token = userData['authToken'] ?? '';

      // First attempt with current token
      http.Response response = await request(token);

      // If token is expired, refresh and try again
      if (response.statusCode == 401 || response.statusCode == 403) {
        final newToken = await _refreshToken();
        if (newToken != null) {
          response = await request(newToken);
        } else {
          // If refresh fails, redirect to login
          // _redirectToLogin();
          return response;
        }
      }

      return response;
    } catch (e) {
      throw Exception('Authentication failed: $e');
    }
  }

  void _redirectToLogin() {
    // Clear stored data and show login dialog or navigate to login screen
    // SecureStorageService.deleteUserDetails();
    
    // Option 1: Show an alert and then navigate
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _showLoginRequiredDialog();
    });
  }

  void _showLoginRequiredDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Session Expired'),
          content: const Text('Your session has expired. Please login again.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const SignIn(),
                          ),
                        );
                // Navigate to login screen - adjust this based on your app structure
                _navigateToLoginScreen();
              },
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }

  void _navigateToLoginScreen() {
    // This depends on your app structure. Here are a few options:
    
    // Option 1: If you're using Navigator with routes
    // Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
    
    // Option 2: If you have a login screen widget
    // Navigator.pushAndRemoveUntil(
    //   context,
    //   MaterialPageRoute(builder: (context) => LoginScreen()),
    //   (route) => false,
    // );
    
    // Option 3: Show a login dialog or redirect to your auth flow
    // For now, we'll just show an error message
    setState(() {
      errorMessage = 'Please restart the app to login again.';
      isLoading = false;
    });
  }

  Future<void> _fetchDriverSchedules() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = '';
      });
      print("token before: $accessToken");

      final response = await _makeAuthenticatedRequest((String token) {
        return http.get(
          Uri.parse('http://192.168.8.117:5000/drivers/schedules'),
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
            upcomingTrips = (data['schedules'] as List).map((schedule) {
              return DriverTrip.fromApi(schedule);
            }).toList();
            isLoading = false;
          });
        } else {
          setState(() {
            errorMessage = data['message'] ?? 'Failed to load schedules';
            isLoading = false;
          });
        }
      } else {
        setState(() {
          errorMessage = 'Failed to load schedules: ${response.statusCode}';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error: ${e.toString().replaceAll('Exception: ', '')}';
        isLoading = false;
      });
      
      // If it's an authentication error, show login required
      // if (e.toString().contains('Authentication failed') || 
      //     e.toString().contains('User not logged in')) {
      //   _redirectToLogin();
      // }
    }
  }

  Future<void> _refreshData() async {
    setState(() {
      isLoading = true;
      errorMessage = '';
    });
    await _fetchDriverSchedules();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text(
          'My Assigned Trips',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: const Color(0xFF4E1A93),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _refreshData,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Welcome ${driverName.isNotEmpty ? driverName : 'Driver'}!",
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF4E1A93),
              ),
            ),
            const SizedBox(height: 5),
            const Text(
              "Your assigned trips are listed below",
              style: TextStyle(fontSize: 16, color: Colors.grey),
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
                        'Loading your trips...',
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
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: errorMessage.contains('Please restart') ? Colors.orange : Colors.red,
                      ),
                      const SizedBox(height: 16),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Text(
                          errorMessage,
                          style: const TextStyle(color: Colors.grey),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (!errorMessage.contains('Please restart'))
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
            else if (upcomingTrips.isEmpty)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.directions_bus_outlined,
                        size: 64,
                        color: Colors.grey,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'No trips scheduled for today',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Check back later for new assignments',
                        style: TextStyle(color: Colors.grey),
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
                    itemCount: upcomingTrips.length,
                    itemBuilder: (context, index) {
                      return TripCard(trip: upcomingTrips[index], authToken: accessToken);
                    },
                  ),
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
  final String startLocation;
  final String endLocation;
  final String distance;
  final String busType;
  final String licensePlate;

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
  });

  factory DriverTrip.fromApi(Map<String, dynamic> apiData) {
    final route = apiData['route'];
    final bus = apiData['bus'];
    
    // Format time to 12-hour format
    String formatTime(String timeString) {
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

    return DriverTrip(
      id: apiData['schedule_id'].toString(),
      route: '${route['start_location']} to ${route['end_location']}',
      busNumber: bus['bus_number'],
      startTime: formatTime(apiData['departure_time']),
      endTime: formatTime(apiData['arrival_time']),
      date: 'Today',
      status: apiData['status'],
      startLocation: route['start_location'],
      endLocation: route['end_location'],
      distance: route['distance'],
      busType: bus['bus_type'],
      licensePlate: bus['license_plate'],
    );
  }
}

// Trip Card Widget
class TripCard extends StatelessWidget {
  final DriverTrip trip;
  final String authToken;

  const TripCard({super.key, required this.trip, required this.authToken});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
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
                      trip.route,
                      style: const TextStyle(
                        fontSize: 18,
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
                      color: _getStatusColor(trip.status),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      trip.status.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              
              // Route Information
              _buildInfoRow(
                Icons.place,
                'Route',
                '${trip.startLocation} → ${trip.endLocation}',
              ),
              
              const SizedBox(height: 8),
              
              // Bus Information
              Row(
                children: [
                  Expanded(
                    child: _buildInfoRow(
                      Icons.directions_bus,
                      'Bus',
                      '${trip.busNumber} (${trip.busType})',
                    ),
                  ),
                  Expanded(
                    child: _buildInfoRow(
                      Icons.confirmation_number,
                      'Plate',
                      trip.licensePlate,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Time and Date
              Row(
                children: [
                  Expanded(
                    child: _buildInfoRow(
                      Icons.access_time,
                      'Time',
                      '${trip.startTime} - ${trip.endTime}',
                    ),
                  ),
                  Expanded(
                    child: _buildInfoRow(
                      Icons.calendar_today,
                      'Date',
                      trip.date,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Distance
              _buildInfoRow(
                Icons.linear_scale,
                'Distance',
                '${trip.distance} km',
              ),
              
              const SizedBox(height: 16),
              
              // Action Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => DriverTripDetailScreen(trip: trip,  authToken: authToken),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4E1A93),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.remove_red_eye, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'View Trip Details',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFF4E1A93)),
        const SizedBox(width: 4),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: const TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
              children: [
                TextSpan(
                  text: '$label: ',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF4E1A93),
                  ),
                ),
                TextSpan(text: value),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
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
}