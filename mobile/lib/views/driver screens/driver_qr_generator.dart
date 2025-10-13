import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:ticket_tap/services/secure_storage_services.dart';
import 'package:ticket_tap/views/driver%20screens/d_homeScreen.dart';
import 'dart:convert';

class DriverQrGeneratorScreen extends StatefulWidget {
  final DriverTrip trip;

  const DriverQrGeneratorScreen({super.key, required this.trip});

  @override
  State<DriverQrGeneratorScreen> createState() => _DriverQrGeneratorScreenState();
}

class _DriverQrGeneratorScreenState extends State<DriverQrGeneratorScreen> {
  String? qrData;
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _generateQrData();
  }

  Future<void> _generateQrData() async {
    try {
      final userData = await SecureStorageService.getUserData();

      // Create a structured JSON object for QR data
      final qrPayload = {
        'trip_id': widget.trip.id,
        'schedule_id': widget.trip.id, // Assuming trip.id is the schedule ID
        'driver_id': userData['userId'],
        'driver_name': userData['name'],
        'route': widget.trip.route,
        'bus_number': widget.trip.busNumber,
        'start_location': widget.trip.startLocation,
        'end_location': widget.trip.endLocation,
        'scheduled_time': widget.trip.startTime,
        'qr_timestamp': DateTime.now().toIso8601String(),
        'type': 'ticket_purchase',
        'price': _calculatePrice(widget.trip.distance),
      };

      setState(() {
        qrData = json.encode(qrPayload);
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = 'Error generating QR code: $e';
        isLoading = false;
      });
    }
  }

  double _calculatePrice(String distance) {
    try {
      // Remove 'km' and convert to double
      final distanceValue = double.parse(distance.replaceAll('km', '').trim());
      // Simple pricing: 50 LKR per km
      return (distanceValue * 50.0).roundToDouble();
    } catch (e) {
      return 300.0; // Default price
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'QR Code for Passengers',
            style: TextStyle(color: Colors.white),
          ),
          backgroundColor: const Color(0xFF4E1A93),
          elevation: 0,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: isLoading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4E1A93)),
                        ),
                        SizedBox(height: 16),
                        Text(
                          'Generating QR Code...',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  )
                : errorMessage != null
                    ? Center(
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
                              errorMessage!,
                              style: const TextStyle(color: Colors.grey),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _generateQrData,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF4E1A93),
                                foregroundColor: Colors.white,
                              ),
                              child: Text('try_again'.tr()),
                            ),
                          ],
                        ),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Scan for Ticket Purchase',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[700],
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Passengers can scan this code to buy tickets',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 30),
                          
                          // QR Code Card
                          Card(
                            elevation: 6,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: const Color(0xFF4E1A93).withOpacity(0.2),
                                ),
                              ),
                              padding: const EdgeInsets.all(24.0),
                              child: Column(
                                children: [
                                  QrImageView(
                                    data: qrData!,
                                    version: QrVersions.auto,
                                    size: 200.0,
                                    eyeStyle: const QrEyeStyle(
                                      eyeShape: QrEyeShape.square,
                                      color: Color(0xFF4E1A93),
                                    ),
                                    dataModuleStyle: const QrDataModuleStyle(
                                      dataModuleShape: QrDataModuleShape.square,
                                      color: Color(0xFF4E1A93),
                                    ),
                                  ),
                                  const SizedBox(height: 20),
                                  
                                  // Trip Information
                                  _buildInfoRow('Route', widget.trip.route),
                                  _buildInfoRow('Bus', '${widget.trip.busNumber} (${widget.trip.busType})'),
                                  _buildInfoRow('Departure', '${widget.trip.startTime} • ${widget.trip.date}'),
                                  _buildInfoRow('Route', '${widget.trip.startLocation} → ${widget.trip.endLocation}'),
                                  _buildInfoRow('Distance', widget.trip.distance),
                                  // _buildInfoRow('Estimated Price', 'LKR ${_calculatePrice(widget.trip.distance).toStringAsFixed(0)}'),
                                ],
                              ),
                            ),
                          ),
                          
                          const SizedBox(height: 30),
                          
                          // Action Buttons
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    Clipboard.setData(ClipboardData(text: qrData!));
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: const Text('QR code data copied to clipboard!'),
                                        backgroundColor: Colors.green.shade600,
                                        behavior: SnackBarBehavior.floating,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                      ),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.blue.shade700,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  icon: const Icon(Icons.copy, size: 20),
                                  label: const Text('Copy QR Data'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    _showQrDetails(context, qrData!);
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF4E1A93),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  icon: const Icon(Icons.info_outline, size: 20),
                                  label: const Text('View Details'),
                                ),
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Instructions
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.lightbulb_outline, 
                                        color: Colors.orange.shade600, size: 18),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Instructions for Passengers',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  '• Scan this QR code with the TicketTap app\n'
                                  '• Select your boarding and destination stops\n'
                                  '• Make payment to purchase your ticket\n'
                                  '• Show the digital ticket to the driver when boarding',
                                  style: TextStyle(fontSize: 12, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
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
                fontSize: 12,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showQrDetails(BuildContext context, String qrData) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text(
            'QR Code Details',
            style: TextStyle(color: Color(0xFF4E1A93)),
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'This QR code contains the following data:',
                  style: TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: SelectableText(
                    qrData,
                    style: const TextStyle(
                      fontFamily: 'Monospace',
                      fontSize: 10,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'When scanned, passengers will be able to:\n'
                  '• View trip details\n'
                  '• Select boarding point\n'
                  '• Make payment\n'
                  '• Receive digital ticket',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }
}