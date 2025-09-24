import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:ticket_tap/api/api_services.dart';
import 'package:ticket_tap/services/secure_storage_services.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class PaymentScreen extends StatefulWidget {
  final Map<String, dynamic> qrData;

  const PaymentScreen({super.key, required this.qrData});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String? _selectedStartLocation;
  String? _selectedEndLocation;
  double _calculatedFare = 0.0;
  bool _isLoading = true;
  bool _isProcessingPayment = false;
  List<String> _stops = [];
  
  // New variables for location search
  final TextEditingController _startLocationController = TextEditingController();
  final TextEditingController _endLocationController = TextEditingController();
  List<String> _startLocationSuggestions = [];
  List<String> _endLocationSuggestions = [];
  bool _isSearchingStart = false;
  bool _isSearchingEnd = false;
  
  // ORS API key
  final String _orsApiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjFkY2I1NWU4MjQ0YTQ1NDNhZDAyYTBmOGMzNDQ3ZTI1IiwiaCI6Im11cm11cjY0In0=';

  @override
  void initState() {
    super.initState();
    _loadRouteStops();
    _initializeStripe();
  }

  Future<void> _initializeStripe() async {
    // Configure Stripe with your publishable key
    Stripe.publishableKey = 'pk_test_your_publishable_key_here';
    // For production, you might want to set this up in main.dart
  }

  Future<void> _loadRouteStops() async {
    // Simulate API call to get stops for this route
    await Future.delayed(const Duration(seconds: 1));
    
    // This would come from your API based on the route
    setState(() {
      _stops = [
        widget.qrData['start_location'] ?? 'Start Location',
        'City Center',
        'Main Bus Stand',
        'University',
        'Shopping Mall',
        widget.qrData['end_location'] ?? 'End Location'
      ];
      _isLoading = false;
    });
  }

  // Get location suggestions from ORS
  Future<List<String>> _getLocationSuggestions(String query) async {
    if (query.length < 3) return [];
    
    try {
      final response = await http.get(
        Uri.parse('https://api.openrouteservice.org/geocode/autocomplete?api_key=$_orsApiKey&text=$query')
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final features = data['features'] as List<dynamic>;
        
        return features.map<String>((feature) {
          return feature['properties']['label'] as String;
        }).toList();
      }
    } catch (e) {
      print('Error getting suggestions: $e');
    }
    
    return [];
  }

  // Get coordinates for a location
  Future<Map<String, double>?> _getCoordinates(String location) async {
    try {
      final response = await http.get(
        Uri.parse('https://api.openrouteservice.org/geocode/search?api_key=$_orsApiKey&text=${Uri.encodeComponent(location)}')
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final features = data['features'] as List<dynamic>;
        
        if (features.isNotEmpty) {
          final geometry = features[0]['geometry'];
          final coordinates = geometry['coordinates'] as List<dynamic>;
          return {
            'longitude': coordinates[0].toDouble(),
            'latitude': coordinates[1].toDouble(),
          };
        }
      }
    } catch (e) {
      print('Error getting coordinates: $e');
    }
    
    return null;
  }

  // Calculate distance between two locations using ORS
  Future<double?> _calculateDistance(String startLocation, String endLocation) async {
    try {
      final startCoords = await _getCoordinates(startLocation);
      final endCoords = await _getCoordinates(endLocation);
      
      if (startCoords == null || endCoords == null) return null;
      
      final response = await http.post(
        Uri.parse('https://api.openrouteservice.org/v2/directions/driving-car'),
        headers: {
          'Authorization': _orsApiKey,
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'coordinates': [
            [startCoords['longitude'], startCoords['latitude']],
            [endCoords['longitude'], endCoords['latitude']],
          ]
        }),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final routes = data['routes'] as List<dynamic>;
        if (routes.isNotEmpty) {
          final summary = routes[0]['summary'] as Map<String, dynamic>;
          final distanceInMeters = summary['distance'] as double;
          final distanceInKm = distanceInMeters / 1000;
          return distanceInKm;
        }
      }
    } catch (e) {
      print('Error calculating distance: $e');
    }
    
    return null;
  }

  Future<void> _calculateFare() async {
    if (_selectedStartLocation == null || _selectedEndLocation == null) return;

    // Calculate distance using ORS
    final distance = await _calculateDistance(_selectedStartLocation!, _selectedEndLocation!);
    
    if (distance == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error calculating distance. Using default fare calculation.'),
          backgroundColor: Colors.orange,
        ),
      );
      _calculateFareByStops(); // Fallback to stop-based calculation
      return;
    }

    // Distance-based pricing: 30rs minimum + 10rs per km after 1km
    const baseFare = 30.0;
    const ratePerKm = 5.0;
    const freeKm = 5.0;
    
    double fare = baseFare;
    if (distance > freeKm) {
      fare += (distance - freeKm) * ratePerKm;
    }

    setState(() {
      _calculatedFare = fare;
    });
  }

  // Fallback calculation based on stops
  void _calculateFareByStops() {
    if (_selectedStartLocation == null || _selectedEndLocation == null) return;
    
    final startIndex = _stops.indexOf(_selectedStartLocation!);
    final endIndex = _stops.indexOf(_selectedEndLocation!);
    
    if (startIndex == -1 || endIndex == -1 || startIndex >= endIndex) return;

    final stopCount = endIndex - startIndex;
    // Simple fare calculation: base fare + per stop fare
    const baseFare = 30.0;
    const perStopFare = 5.0;
    
    setState(() {
      _calculatedFare = baseFare + (stopCount * perStopFare);
    });
  }

  Future<void> _processPayment() async {
    if (_selectedStartLocation == null || _selectedEndLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select both start and end locations'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isProcessingPayment = true;
    });

    try {
      final userData = await SecureStorageService.getUserData();
      if (userData == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please login again'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // 1. Call backend to create payment intent
      final paymentResponse = await ApiService.createPaymentIntent({
        'amount': (_calculatedFare * 100).round(), // Convert to cents
        'currency': 'lkr',
        'userId': userData['userId'],
        'ticketDetails': {
          'startLocation': _selectedStartLocation,
          'endLocation': _selectedEndLocation,
          'routeId': widget.qrData['route_id'] ?? 'unknown',
          'busNumber': widget.qrData['bus_number'] ?? 'unknown',
          'distance': await _calculateDistance(_selectedStartLocation!, _selectedEndLocation!),
          'scheduledTime': widget.qrData['scheduled_time'] ?? 'unknown',
          'fare': _calculatedFare,
        }
      });

      await Stripe.instance.applySettings();

      // 2. Get the client secret from backend response
      final String clientSecret = paymentResponse['clientSecret'];
      final String paymentIntentId = paymentResponse['paymentIntentId'];

      // 3. Initialize the payment sheet with the client secret
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'TicketTap',
          // style: ThemeMode.light,
          // Remove customerId and ephemeralKey if your backend doesn't provide them
        ),
      );

      // 4. Display the payment sheet
      await Stripe.instance.presentPaymentSheet();

      // 5. If we reach here, payment was successful - confirm with backend
      final result = await ApiService.confirmPayment({
        'paymentIntentId': paymentIntentId,
        'ticketDetails': {
          'startLocation': _selectedStartLocation,
          'endLocation': _selectedEndLocation,
          'routeId': widget.qrData['route_id'] ?? 'unknown',
          'busNumber': widget.qrData['bus_number'] ?? 'unknown',
          'fare': _calculatedFare,
          'userId': userData['id'],
        }
      });

      if (result['success']) {
        _showPaymentSuccessDialog(result['ticket']);
      } else {
        throw Exception('Payment confirmation failed');
      }

    } on StripeException catch (e) {
      // Handle Stripe-specific errors
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Payment failed: ${e.error.localizedMessage}'),
          backgroundColor: Colors.red,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Payment failed: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isProcessingPayment = false;
      });
    }
  }

  void _showPaymentSuccessDialog(Map<String, dynamic> ticket) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Icon(Icons.check_circle, color: Colors.green, size: 64),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Payment Successful!',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              Text('Amount: LKR ${_calculatedFare.toStringAsFixed(2)}'),
              const SizedBox(height: 10),
              Text('Ticket: ${_selectedStartLocation} → ${_selectedEndLocation}'),
              const SizedBox(height: 10),
              Text('Ticket ID: ${ticket['id']}'),
              const SizedBox(height: 20),
              const Text(
                'Your digital ticket has been generated. Show it to the driver when boarding.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop(); // Go back to previous screen
              },
              child: const Text('Done'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Purchase Ticket',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: const Color(0xFF4E1A93),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4E1A93)),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Trip Information Card
                  _buildTripInfoCard(),
                  const SizedBox(height: 24),
                  // Location Selection Card
                  _buildLocationSelectionCard(),
                  const SizedBox(height: 30),
                  // Payment Button
                  _buildPaymentButton(),
                ],
              ),
            ),
    );
  }

  Widget _buildTripInfoCard() {
    return Material(
      elevation: 4,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF4E1A93).withOpacity(0.2)),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Trip Details',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF4E1A93),
              ),
            ),
            const SizedBox(height: 12),
            _buildInfoRow('Route', widget.qrData['route'] ?? 'Unknown'),
            _buildInfoRow('Bus', widget.qrData['bus_number'] ?? 'Unknown'),
            _buildInfoRow('Time', widget.qrData['scheduled_time'] ?? 'Unknown'),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationSelectionCard() {
    return Material(
      elevation: 4,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF4E1A93).withOpacity(0.2)),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select Your Journey',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF4E1A93),
              ),
            ),
            const SizedBox(height: 16),

            // Start Location Search
            _buildLocationSearchField(
              'Start Location',
              _startLocationController,
              _startLocationSuggestions,
              _isSearchingStart,
              (String value) {
                setState(() {
                  _selectedStartLocation = value;
                  _startLocationController.text = value;
                  _startLocationSuggestions = [];
                  _isSearchingStart = false;
                  _selectedEndLocation = null;
                  _endLocationController.clear();
                  _calculatedFare = 0.0; // Reset fare
                });
                _calculateFare();
              },
              (String query) async {
                setState(() {
                  _isSearchingStart = true;
                });
                
                final suggestions = await _getLocationSuggestions(query);
                setState(() {
                  _startLocationSuggestions = suggestions;
                  _isSearchingStart = false;
                });
              },
            ),

            const SizedBox(height: 16),

            // End Location Search
            _buildLocationSearchField(
              'End Location',
              _endLocationController,
              _endLocationSuggestions,
              _isSearchingEnd,
              (String value) {
                setState(() {
                  _selectedEndLocation = value;
                  _endLocationController.text = value;
                  _endLocationSuggestions = [];
                  _isSearchingEnd = false;
                });
                _calculateFare();
              },
              (String query) async {
                setState(() {
                  _isSearchingEnd = true;
                });
                
                final suggestions = await _getLocationSuggestions(query);
                setState(() {
                  _endLocationSuggestions = suggestions;
                  _isSearchingEnd = false;
                });
              },
            ),

            const SizedBox(height: 20),

            // Fare Calculation
            if (_calculatedFare > 0)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Fare:',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          'LKR ${_calculatedFare.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_selectedStartLocation != null && _selectedEndLocation != null)
                      FutureBuilder<double?>(
                        future: _calculateDistance(_selectedStartLocation!, _selectedEndLocation!),
                        builder: (context, snapshot) {
                          if (snapshot.connectionState == ConnectionState.waiting) {
                            return const Text(
                              'Calculating distance...',
                              style: TextStyle(fontSize: 12, color: Colors.grey),
                            );
                          }
                          if (snapshot.hasData) {
                            return Text(
                              'Distance: ${snapshot.data!.toStringAsFixed(2)} km',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            );
                          }
                          return const Text(
                            'Distance: Unknown',
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                          );
                        },
                      ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isProcessingPayment ? null : _processPayment,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF4E1A93),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: _isProcessingPayment
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : const Text(
                'Pay Now',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
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

  Widget _buildLocationSearchField(
    String label,
    TextEditingController controller,
    List<String> suggestions,
    bool isSearching,
    Function(String) onSuggestionSelected,
    Function(String) onSearch,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Column(
            children: [
              TextField(
                controller: controller,
                decoration: InputDecoration(
                  hintText: 'Type to search $label',
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  suffixIcon: isSearching
                      ? const Padding(
                          padding: EdgeInsets.all(8.0),
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : null,
                ),
                onChanged: (value) {
                  if (value.length >= 3) {
                    onSearch(value);
                  } else {
                    setState(() {
                      suggestions.clear();
                    });
                  }
                },
              ),
              if (suggestions.isNotEmpty)
                Container(
                  constraints: const BoxConstraints(maxHeight: 150),
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: suggestions.length,
                    itemBuilder: (context, index) {
                      return ListTile(
                        title: Text(suggestions[index]),
                        dense: true,
                        onTap: () => onSuggestionSelected(suggestions[index]),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}