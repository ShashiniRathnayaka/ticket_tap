import 'package:flutter/material.dart';
import 'package:ticket_tap/api/sign_up_api.dart';
import 'package:ticket_tap/themes/AppColors.dart';
import 'package:ticket_tap/views/driver%20screens/d_homeScreen.dart';
import 'package:ticket_tap/views/passenger%20screens/p_homeScreen.dart';

class SignUp extends StatefulWidget {
  const SignUp({super.key});

  @override
  State<SignUp> createState() => _SignUpState();
}

class _SignUpState extends State<SignUp> {
  String? selectedRole = 'passenger';
    final formKey = GlobalKey<FormState>();
    final TextEditingController emailController = TextEditingController();
    final TextEditingController nameController = TextEditingController();
    final TextEditingController passwordController = TextEditingController();
    final TextEditingController confirmPasswordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    double screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Form(
            key: formKey,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Create a new account with email."),
                  SizedBox(height: 5),
                  
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5.0),
                    child: TextFormField(
                      controller: nameController,
                      decoration: InputDecoration(
                        labelText: 'User Name',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.all(12),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Name cannot be empty';
                        }
                        return null;
                      },
                    ),
                  ),
          
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5.0),
                    child: TextFormField(
                      controller: emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Email',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.all(12),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Email cannot be empty';
                        }
                        String emailPattern = r'^[a-zA-Z0-9.a-zA-Z0-9!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
                        if (!RegExp(emailPattern).hasMatch(value)) {
                          return 'Enter a valid email';
                        }
                        return null;
                      },
                    ),
                  ),
        
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5.0),
                    child: DropdownButtonFormField<String>(
                      decoration: InputDecoration(
                        labelText: 'Select a role',
                        border: OutlineInputBorder(),
                        // contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                      ),
                      items: ['driver', 'passenger'].map((String role) {
                        return DropdownMenuItem<String>(
                          value: role,
                          child: Text(role),
                        );
                      }).toList(),
                      value: selectedRole,
                      onChanged: (value) {
                        // Handle selection
                        setState(() {
                          selectedRole = value;
                        });
                      },
                    ),
                  ),
          
                  // Password Field
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5.0),
                    child: TextFormField(
                      controller: passwordController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.all(12),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Password cannot be empty';
                        }
                        if (value.length < 8) {
                          return 'Password must be at least 8 characters';
                        }
                        if (!RegExp(r'[A-Z]').hasMatch(value)) {
                          return 'Password must contain an uppercase letter';
                        }
                        if (!RegExp(r'[a-z]').hasMatch(value)) {
                          return 'Password must contain a lowercase letter';
                        }
                        if (!RegExp(r'[0-9]').hasMatch(value)) {
                          return 'Password must contain a number';
                        }
                        return null;
                      },
                    ),
                  ),
          
                  // Confirm Password Field
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5.0),
                    child: TextFormField(
                      controller: confirmPasswordController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'Confirm Password',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.all(12),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Confirm Password cannot be empty';
                        }
                        if (value != passwordController.text) {
                          return 'Passwords do not match';
                        }
                        return null;
                      },
                    ),
                  ),
          
                  SizedBox(height: 10),
          
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
                      if (formKey.currentState!.validate()) {
                        print('Name: ${nameController.text}');
                        print('Email: ${emailController.text}');
                        print('Password: ${passwordController.text}');
                        print('Selected Role: $selectedRole');

                        try {
                          final result = await signUp(
                            nameController.text,
                            emailController.text,
                            passwordController.text,
                            selectedRole!,
                          );

                          if (result is Map && result['user'] != null) {
                            print('Sign-up successful!');
                            print('role: ${result['user']['role']}');

                            if (result['user']['role'] == 'driver') {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (context) => const DHomescreen()),
                              );
                            } else if (result['user']['role'] == 'passenger') {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (context) => const PHomescreen()),
                              );
                            }
                          } else if (result is String) {
                            // It's an error message from backend (e.g., 409)
                            print('Sign-up failed: $result');
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(result)),
                            );
                          } else {
                            print('Sign-up failed: Unknown error');
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Something went wrong during sign-up')),
                            );
                          }
                        } catch (e) {
                          print('Sign-up failed: $e');
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Sign-up failed: $e')),
                          );
                        }
                      }
                    },
                    child: Text('Sign up', style: TextStyle(fontSize: 16)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
