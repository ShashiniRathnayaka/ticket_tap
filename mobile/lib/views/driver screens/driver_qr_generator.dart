import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:ticket_tap/views/driver%20screens/d_homeScreen.dart';

class DriverQrGeneratorScreen extends StatelessWidget {
  final DriverTrip trip;

  const DriverQrGeneratorScreen({super.key, required this.trip});

  @override
  Widget build(BuildContext context) {
    // Generate a unique QR code data for this trip
    final String qrData = 'TRIP:${trip.id}:${DateTime.now().millisecondsSinceEpoch}';

    return Scaffold(
      appBar: AppBar(
        title: const Text('QR Code for Passengers'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Scan this QR code for ticket validation',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[700]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            
            // QR Code
            Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    QrImageView(
                      data: qrData,
                      version: QrVersions.auto,
                      size: 200.0,
                    ),
                    const SizedBox(height: 15),
                    Text(
                      'Route: ${trip.route}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text('Bus: ${trip.busNumber}'),
                    Text('Time: ${trip.startTime}'),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Action Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                ElevatedButton(
                  onPressed: () {
                    _shareQrCode(context, qrData);
                  },
                  child: const Text('Share QR Code'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: qrData));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('QR code data copied to clipboard!')),
                    );
                  },
                  child: const Text('Copy Data'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _shareQrCode(BuildContext context, String qrData) {
    // This would typically integrate with a share plugin
    // For now, we'll just show a dialog
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Share QR Code'),
          content: const Text('This would typically open the share dialog to share the QR code image or data.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }
}