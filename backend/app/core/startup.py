async def check_cpanel_environment():
    try:
        # Check MySQL max_connections
        async with engine.connect() as conn:
            result = await conn.execute("SHOW VARIABLES LIKE 'max_connections'")
            max_conn = result.fetchone()[1]
            if int(max_conn) > 100:  # cPanel typical limit
                logger.warning(f"max_connections too high: {max_conn}")
        
        # Check tmp directory permissions
        tmp_dir = "/tmp"
        if not os.access(tmp_dir, os.W_OK):
            logger.error("No write access to /tmp directory")
        
        # Check process limits
        import resource
        soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
        if soft < 1024:
            logger.warning(f"Low file descriptor limit: {soft}")
        
        return True
    except Exception as e:
        logger.error(f"cPanel environment check failed: {str(e)}")
        return False 