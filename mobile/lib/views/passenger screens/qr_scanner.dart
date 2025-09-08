import 'dart:async';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_barcode_scanning/google_mlkit_barcode_scanning.dart';

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
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text("QR Code Scanned"),
          content: Text("Scanned data: $code"),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop(code);
              },
              child: const Text("OK"),
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
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          title: const Text("QR Scanner", style: TextStyle(color: Colors.white)),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: Center(
          child: Text(
            _errorMessage!,
            style: const TextStyle(color: Colors.white),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text("QR Scanner", style: TextStyle(color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
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
                child: Text(
                  'Error: ${snapshot.error}',
                  style: const TextStyle(color: Colors.white),
                ),
              );
            }
            return Stack(
              children: [
                CameraPreview(_controller!),
                _buildScannerOverlay(),
                const Center(
                  child: Text(
                    "Scanning QR code...",
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ),
              ],
            );
          } else {
            return const Center(child: CircularProgressIndicator());
          }
        },
      ),
    );
  }

  Widget _buildScannerOverlay() {
    return CustomPaint(
      painter: _QrScannerOverlay(borderColor: Colors.blue),
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
    final double cornerLength = 20.0;

    final Paint borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    final double squareSize = width * 0.7;
    final double left = (width - squareSize) / 2;
    final double top = (height - squareSize) / 2;

    canvas.drawRect(Rect.fromLTWH(left, top, squareSize, squareSize), borderPaint);

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