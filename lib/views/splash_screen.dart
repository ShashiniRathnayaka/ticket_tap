import 'package:flutter/material.dart';
import 'package:ticket_tap/themes/gradient_background.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return GradientScaffold(
      body: Center(
        child: Image.asset(
          'assets/images/example_logo.png',
          // height: screenHeight * 0.3,
          // width: screenWidth * 0.5,
        ),
      ),
    );
  }
}