import 'package:flutter/material.dart';
import '../database/db_helper.dart';
import '../services/sync_service.dart';

class JobListScreen extends StatefulWidget {
  const JobListScreen({super.key});

  @override
  State<JobListScreen> createState() => _JobListScreenState();
}

class _JobListScreenState extends State<JobListScreen> {
  final SyncService _syncService = SyncService();
  List<Map<String, dynamic>> _jobs = [];
  bool _isLoading = true;
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _loadJobs();
  }

  Future<void> _loadJobs() async {
    final db = await DatabaseHelper.instance.database;
    final jobs = await db.query('jobs', orderBy: 'updatedAt DESC');
    setState(() {
      _jobs = jobs;
      _isLoading = false;
    });
  }

  Future<void> _performSync() async {
    setState(() {
      _isSyncing = true;
    });

    try {
      await _syncService.syncOfflineJobs();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sync completed!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sync failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSyncing = false;
        });
        await _loadJobs(); // Refresh jobs if needed
      }
    }
  }

  // Helper method to get color based on priority
  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return Colors.red.shade900.withOpacity(0.3);
      case 'medium':
        return Colors.orange.shade900.withOpacity(0.3);
      case 'low':
      default:
        return Colors.blueGrey.shade900.withOpacity(0.3);
    }
  }
  
  Color _getPriorityTextColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return Colors.red.shade200;
      case 'medium':
        return Colors.orange.shade200;
      case 'low':
      default:
        return Colors.blueGrey.shade200;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Atlas Field Tech', style: TextStyle(fontWeight: FontWeight.w600)),
        centerTitle: true,
        actions: [
          if (_isSyncing)
            const Padding(
              padding: EdgeInsets.only(right: 16.0),
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _jobs.isEmpty
              ? const Center(
                  child: Text(
                    'No jobs assigned.',
                    style: TextStyle(color: Colors.white54, fontSize: 16),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16.0),
                  itemCount: _jobs.length,
                  itemBuilder: (context, index) {
                    final job = _jobs[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12.0),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: Colors.white24),
                      ),
                      color: theme.cardColor,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    job['title'] ?? 'Unknown Job',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _getPriorityColor(job['priority']),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: _getPriorityTextColor(job['priority']).withOpacity(0.3)),
                                  ),
                                  child: Text(
                                    (job['priority'] as String).toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: _getPriorityTextColor(job['priority']),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined, size: 16, color: Colors.white70),
                                const SizedBox(width: 4),
                                Text(
                                  job['location'] ?? 'No location',
                                  style: const TextStyle(color: Colors.white70),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white10,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    job['status'].toString().replaceAll('_', ' ').toUpperCase(),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.white,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isSyncing ? null : _performSync,
        icon: const Icon(Icons.sync),
        label: const Text('Sync Now'),
        backgroundColor: _isSyncing ? Colors.grey[800] : theme.colorScheme.primary,
        foregroundColor: Colors.white,
      ),
    );
  }
}
