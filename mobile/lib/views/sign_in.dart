import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:ticket_tap/services/secure_storage_services.dart';
import 'package:ticket_tap/themes/AppColors.dart';
import 'package:ticket_tap/themes/gradient_background.dart';
import 'package:ticket_tap/views/driver%20screens/d_homeScreen.dart';
import 'package:ticket_tap/views/passenger%20screens/p_homeScreen.dart';
import 'package:ticket_tap/views/sign_up.dart';

class SignIn extends StatefulWidget {
  const SignIn({super.key});

  @override
  State<SignIn> createState() => _SignInState();
}

class _SignInState extends State<SignIn> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    double screenHeight = MediaQuery.of(context).size.height;
    double screenWidth = MediaQuery.of(context).size.width;

    return GradientScaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            SizedBox(height: screenHeight * 0.05),
            Image.asset(
              'assets/images/example_logo.png',
              height: screenHeight * 0.3,
              width: screenWidth * 0.5,
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.05),
              child: Container(
                width: screenWidth * 0.9,
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(15),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 5,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: DefaultTabController(
                  length: 2,
                  child: Column(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.white,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: TabBar(
                          labelColor: AppColors.primaryColor,
                          unselectedLabelColor: Colors.grey,
                          indicatorColor: AppColors.primaryColor,
                          indicatorWeight: 3,
                          tabs: [Tab(text: "Sign In"), Tab(text: "Sign Up")],
                        ),
                      ),
                      SizedBox(height: 20),
                      SizedBox(
                        height:
                            screenHeight * 0.4, // Fixed height for tab views
                        child: TabBarView(
                          children: [buildSignInTab(), SignUp()],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildSignInTab() {
    double screenWidth = MediaQuery.of(context).size.width;

    return Form(
      key: _formKey,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Please enter your email and password to sign in."),
            SizedBox(height: 15),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: TextFormField(
                controller: emailController,
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Email cannot be empty';
                  }
                  return null;
                },
                decoration: InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.all(12),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: TextFormField(
                controller: passwordController,
                obscureText: true,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Password cannot be empty';
                  }
                  return null;
                },
                decoration: InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.all(12),
                ),
              ),
            ),
            SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                fixedSize: Size(screenWidth * 0.8, 50),
                backgroundColor: AppColors.primaryColor,
                foregroundColor: AppColors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: () async {
                if (_formKey.currentState!.validate()) {
                  // Show loading indicator
                  setState(() {
                    _isLoading = true;
                  });

                  try {
                    // Call login API
                    final response = await http.post(
                      Uri.parse('http://192.168.8.117:5000/auth/login'),
                      headers: {'Content-Type': 'application/json'},
                      body: jsonEncode({
                        'email': emailController.text,
                        'password': passwordController.text,
                      }),
                    );

                    // Parse the response
                    final responseData = jsonDecode(response.body);
                    // final storageService = SecureStorageService();

                    if (response.statusCode == 200) {
                      // Login successful
                      print('Login successful!');
                      print('User: ${responseData['user']}');
                      print('Token: ${responseData['token']}');

                      // Save user data to secure storage
                      await SecureStorageService.saveUserData(
                        userId: responseData['user']['id']?.toString() ?? '',
                        email:
                            responseData['user']['email'] ??
                            emailController.text,
                        name: responseData['user']['name'] ?? '',
                        role: responseData['user']['role'] ?? '',
                        authToken: responseData['token'] ?? '',
                        refreshToken: responseData['refreshToken'] ?? '',
                      );

                      // Navigate based on user role
                      final userRole =
                          responseData['user']['role']?.toUpperCase();

                      if (userRole == 'DRIVER') {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const DHomescreen(),
                          ),
                        );
                      } else if (userRole == 'PASSENGER') {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const PHomescreen(),
                          ),
                        );
                      } else {
                        // Show error for unknown role
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('No access rights or permissions'),
                          ),
                        );
                      }
                    } else {
                      // Login failed
                      print('Login failed: ${responseData['message']}');
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            responseData['message'] ?? 'Login failed',
                          ),
                        ),
                      );
                    }
                  } catch (e) {
                    // Handle errors
                    print('Login error: $e');
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text('Login failed: $e')));
                  } finally {
                    // Hide loading indicator
                    setState(() {
                      _isLoading = false;
                    });
                  }
                }
              },
              child: Text('Sign in', style: TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}
