import 'package:flutter/material.dart';
import 'package:ticket_tap/themes/gradient_background.dart';
import 'package:ticket_tap/views/welcome_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 3), () {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const WelcomeScreen()), // Replace NextScreen with your target screen
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return GradientScaffold(
      body: Center(
        child: Image.asset(
          'assets/images/example_logo.png',
        ),
      ),
    );
  }
}