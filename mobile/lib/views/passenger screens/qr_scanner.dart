import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_barcode_scanning/google_mlkit_barcode_scanning.dart';
import 'package:ticket_tap/views/passenger%20screens/payment_screen.dart';

class SimpleQrScanner extends StatefulWidget {
  const SimpleQrScanner({super.key});

  @override
  State<SimpleQrScanner> createState() => _SimpleQrScannerState();
}

class _SimpleQrScannerState extends State<SimpleQrScanner> {
  CameraController? _controller;
  Future<void>? _initializeControllerFuture;
  final BarcodeScanner _barcodeScanner = BarcodeScanner();
  bool _isFlashOn = false;
  Timer? _scanTimer;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'No camera available';
        });
        return;
      }

      final firstCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      _controller = CameraController(
        firstCamera,
        ResolutionPreset.medium,
      );

      _initializeControllerFuture = _controller!.initialize().then((_) {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          _startScanning();
        }
      }).catchError((error) {
        if (mounted) {
          setState(() {
            _isLoading = false;
            _errorMessage = 'Failed to initialize camera: $error';
          });
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Error initializing camera: $e';
        });
      }
    }
  }

  void _startScanning() {
    _scanTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      if (!mounted || _controller == null || !_controller!.value.isInitialized) {
        timer.cancel();
        return;
      }

      try {
        final XFile imageFile = await _controller!.takePicture();
        final inputImage = InputImage.fromFilePath(imageFile.path);
        
        final List<Barcode> barcodes = await _barcodeScanner.processImage(inputImage);

        if (barcodes.isNotEmpty) {
          final String barcodeValue = barcodes.first.displayValue ?? '';
          _processScannedCode(barcodeValue);
          timer.cancel(); // Stop scanning after success
          
          // Delete the temporary image file
          final file = File(imageFile.path);
          if (await file.exists()) {
            await file.delete();
          }
        }
      } catch (e) {
        print('Error scanning: $e');
      }
    });
  }

  void _processScannedCode(String code) {
    try {
      // Parse the QR code data (assuming it's JSON)
      final Map<String, dynamic> qrData = _parseQrData(code);
      
      // Navigate directly to payment screen with QR data
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => PaymentScreen(qrData: qrData),
        ),
      );
      
    } catch (e) {
      // If parsing fails, show error and allow rescan
      _showErrorDialog('Invalid QR code format. Please try again.');
    }
  }

  Map<String, dynamic> _parseQrData(String code) {
    try {
      // Try to parse as JSON first
      return Map<String, dynamic>.from(json.decode(code));
    } catch (e) {
      // If it's not JSON, try to parse as key-value pairs
      final Map<String, dynamic> data = {};
      final pairs = code.split('&');
      for (final pair in pairs) {
        final keyValue = pair.split('=');
        if (keyValue.length == 2) {
          data[keyValue[0]] = keyValue[1];
        }
      }
      return data;
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text(
            "Scan Error",
            style: TextStyle(color: Color(0xFF4E1A93)),
          ),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _startScanning(); // Restart scanning
              },
              child: const Text("Try Again"),
            ),
          ],
        );
      },
    );
  }

  Future<void> _toggleFlash() async {
    if (_controller == null || !_controller!.value.isInitialized) return;

    try {
      if (_isFlashOn) {
        await _controller!.setFlashMode(FlashMode.off);
      } else {
        await _controller!.setFlashMode(FlashMode.torch);
      }
      setState(() {
        _isFlashOn = !_isFlashOn;
      });
    } catch (e) {
      print('Error toggling flash: $e');
    }
  }

  @override
  void dispose() {
    _scanTimer?.cancel();
    _controller?.dispose();
    _barcodeScanner.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4E1A93)),
              ),
              SizedBox(height: 16),
              Text(
                "Initializing Camera...",
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
        ),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          automaticallyImplyLeading: false,
          backgroundColor: const Color(0xFF4E1A93),
          title: const Text("QR Scanner", style: TextStyle(color: Colors.white)),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.camera_alt,
                  size: 64,
                  color: Colors.white,
                ),
                const SizedBox(height: 16),
                Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _initializeCamera,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4E1A93),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text("Retry"),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: const Color(0xFF4E1A93),
        title: const Text("Scan QR Code", style: TextStyle(color: Colors.white)),
        // leading: IconButton(
        //   icon: const Icon(Icons.arrow_back, color: Colors.white),
        //   onPressed: () => Navigator.of(context).pop(),
        // ),
        actions: [
          IconButton(
            icon: Icon(_isFlashOn ? Icons.flash_on : Icons.flash_off, color: Colors.white),
            onPressed: _toggleFlash,
          ),
        ],
      ),
      body: FutureBuilder<void>(
        future: _initializeControllerFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) {
            if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error, color: Colors.white, size: 64),
                    const SizedBox(height: 16),
                    Text(
                      'Camera Error: ${snapshot.error}',
                      style: const TextStyle(color: Colors.white),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _initializeCamera,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4E1A93),
                        foregroundColor: Colors.white,
                      ),
                      child: const Text("Retry"),
                    ),
                  ],
                ),
              );
            }
            return Stack(
              children: [
                CameraPreview(_controller!),
                _buildScannerOverlay(),
                Positioned(
                  bottom: 100,
                  left: 0,
                  right: 0,
                  child: const Column(
                    children: [
                      Icon(Icons.qr_code_scanner, color: Colors.white, size: 40),
                      SizedBox(height: 8),
                      Text(
                        "Align QR code within the frame",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        "Scanning automatically...",
                        style: TextStyle(color: Colors.white54),
                      ),
                    ],
                  ),
                ),
              ],
            );
          } else {
            return const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4E1A93)),
              ),
            );
          }
        },
      ),
    );
  }

  Widget _buildScannerOverlay() {
    return CustomPaint(
      painter: _QrScannerOverlay(borderColor: const Color(0xFF4E1A93)),
    );
  }
}

// Scanner overlay class
class _QrScannerOverlay extends CustomPainter {
  final Color borderColor;

  _QrScannerOverlay({this.borderColor = Colors.white});

  @override
  void paint(Canvas canvas, Size size) {
    final double width = size.width;
    final double height = size.height;
    final double borderWidth = 2.0;
    final double cornerLength = 25.0;

    final Paint borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    final Paint backgroundPaint = Paint()
      ..color = Colors.black.withOpacity(0.6)
      ..style = PaintingStyle.fill;

    // Draw background overlay
    canvas.drawRect(Rect.fromLTWH(0, 0, width, height), backgroundPaint);

    // Cut out the scanning area
    final double squareSize = width * 0.7;
    final double left = (width - squareSize) / 2;
    final double top = (height - squareSize) / 2;
    final scanningRect = Rect.fromLTWH(left, top, squareSize, squareSize);
    
    // Create a path that covers entire screen but cuts out the scanning area
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, width, height))
      ..addRect(scanningRect)
      ..fillType = PathFillType.evenOdd;
    
    canvas.drawPath(path, backgroundPaint);

    // Draw scanning area border
    canvas.drawRect(scanningRect, borderPaint);

    final Paint cornerPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0;

    // Draw corners
    canvas.drawLine(Offset(left, top), Offset(left + cornerLength, top), cornerPaint);
    canvas.drawLine(Offset(left, top), Offset(left, top + cornerLength), cornerPaint);
    
    canvas.drawLine(Offset(left + squareSize, top), Offset(left + squareSize - cornerLength, top), cornerPaint);
    canvas.drawLine(Offset(left + squareSize, top), Offset(left + squareSize, top + cornerLength), cornerPaint);
    
    canvas.drawLine(Offset(left, top + squareSize), Offset(left + cornerLength, top + squareSize), cornerPaint);
    canvas.drawLine(Offset(left, top + squareSize), Offset(left, top + squareSize - cornerLength), cornerPaint);
    
    canvas.drawLine(Offset(left + squareSize, top + squareSize), Offset(left + squareSize - cornerLength, top + squareSize), cornerPaint);
    canvas.drawLine(Offset(left + squareSize, top + squareSize), Offset(left + squareSize, top + squareSize - cornerLength), cornerPaint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}