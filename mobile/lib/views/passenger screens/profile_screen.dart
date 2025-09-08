import 'package:flutter/material.dart';
import 'package:ticket_tap/services/secure_storage_services.dart';
import 'package:ticket_tap/views/sign_in.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _userId = '';
  String _email = '';
  String _name = '';
  String _role = '';

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final userData = await SecureStorageService.getUserData();

    setState(() {
      _userId = userData['userId'] ?? '';
      _email = userData['email'] ?? '';
      _name = userData['name'] ?? '';
      _role = userData['role'] ?? '';
    });
  }

  Future<void> _logout(BuildContext context) async {
    await SecureStorageService.clearAll();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const SignIn()),
      (route) => false,
    );
  }

  Widget _buildInfoTile(String title, String value, IconData icon) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 0),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.blue.shade50,
          child: Icon(icon, color: Colors.blue),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
        ),
        subtitle: Text(
          value.isNotEmpty ? value : "Not available",
          style: const TextStyle(fontSize: 16),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isLoading = _email.isEmpty && _name.isEmpty;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Profile"),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _logout(context),
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  // Profile header
                  Center(
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: Colors.blue.shade100,
                          child: Text(
                            _name.isNotEmpty ? _name[0].toUpperCase() : "?",
                            style: const TextStyle(
                              fontSize: 40,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _name.isNotEmpty ? _name : "No Name",
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          _role.isNotEmpty ? _role : "User",
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Info tiles
                  _buildInfoTile("User ID", _userId, Icons.perm_identity),
                  _buildInfoTile("Email", _email, Icons.email),
                  _buildInfoTile("Role", _role, Icons.badge),
                ],
              ),
            ),
    );
  }
}
